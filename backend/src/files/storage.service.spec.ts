import {
  CreateBucketCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import type { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '@/config/env.validation';
import { StorageService } from './storage.service';

jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));

const env: Record<string, unknown> = {
  S3_ENDPOINT: 'http://localhost:9000',
  S3_REGION: 'us-east-1',
  S3_ACCESS_KEY: 'access',
  S3_SECRET_KEY: 'secret',
  S3_BUCKET: 'avatars',
  S3_PUBLIC_URL: 'http://localhost:9000/avatars/',
  S3_FORCE_PATH_STYLE: true,
};

const s3Error = (httpStatusCode: number): S3ServiceException =>
  new S3ServiceException({ name: 'S3Error', $fault: 'client', $metadata: { httpStatusCode } });

describe('StorageService', () => {
  const send = jest.spyOn(S3Client.prototype, 'send');
  let service: StorageService;

  /** Commands passed to S3, in order, as their class name and input. */
  const sent = (): { command: string; input: unknown }[] =>
    send.mock.calls.map(([command]) => ({
      command: command.constructor.name,
      input: (command as { input: unknown }).input,
    }));

  beforeEach(() => {
    send.mockReset();
    send.mockResolvedValue({} as never);
    const config = { get: jest.fn((key: string) => env[key]) };
    service = new StorageService(config as unknown as ConfigService<EnvironmentVariables, true>);
  });

  it('connects to the storage from the config', async () => {
    const client = (service as unknown as { s3: S3Client }).s3;
    const credentials = await client.config.credentials();

    expect(await client.config.region()).toBe('us-east-1');
    expect(client.config.forcePathStyle).toBe(true);
    expect(credentials).toMatchObject({ accessKeyId: 'access', secretAccessKey: 'secret' });
  });

  describe('upload', () => {
    it('stores the file under a random key with the detected type and returns the key', async () => {
      const body = Buffer.from('image');

      const key = await service.upload({ body, contentType: 'image/png', extension: 'png' });

      expect(key).toMatch(/^[0-9a-f-]{36}\.png$/);
      expect(sent()).toEqual([
        {
          command: PutObjectCommand.name,
          input: expect.objectContaining({
            Bucket: 'avatars',
            Key: key,
            Body: body,
            ContentType: 'image/png',
          }) as unknown,
        },
      ]);
    });

    it('gives every upload its own key', async () => {
      const file = { body: Buffer.from('image'), contentType: 'image/gif', extension: 'gif' };

      const [first, second] = await Promise.all([service.upload(file), service.upload(file)]);

      expect(first).not.toBe(second);
    });

    it('lets the storage error through so the caller keeps the old avatar', async () => {
      send.mockRejectedValueOnce(s3Error(500) as never);

      await expect(
        service.upload({ body: Buffer.from('x'), contentType: 'image/png', extension: 'png' }),
      ).rejects.toBeInstanceOf(S3ServiceException);
    });
  });

  it('deletes the file by its key', async () => {
    await service.delete('old.png');

    expect(sent()).toEqual([
      { command: DeleteObjectCommand.name, input: { Bucket: 'avatars', Key: 'old.png' } },
    ]);
  });

  it('builds the public URL without a double slash', () => {
    expect(service.getPublicUrl('a.png')).toBe('http://localhost:9000/avatars/a.png');
  });

  describe('on start', () => {
    it('leaves an existing bucket as it is', async () => {
      await service.onModuleInit();

      expect(sent().map(({ command }) => command)).toEqual([HeadBucketCommand.name]);
    });

    it('creates a missing bucket and opens its files for public reading', async () => {
      send.mockRejectedValueOnce(s3Error(404) as never);

      await service.onModuleInit();

      const [, create, policy] = sent();
      expect(create).toEqual({ command: CreateBucketCommand.name, input: { Bucket: 'avatars' } });
      expect(policy?.command).toBe(PutBucketPolicyCommand.name);
      const { Policy } = policy?.input as { Policy: string };
      expect(JSON.parse(Policy)).toEqual({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: ['arn:aws:s3:::avatars/*'],
          },
        ],
      });
    });

    it('fails the start when the storage is unreachable or refuses access', async () => {
      send.mockRejectedValueOnce(s3Error(403) as never);
      await expect(service.onModuleInit()).rejects.toBeInstanceOf(S3ServiceException);

      send.mockRejectedValueOnce(new Error('connect ECONNREFUSED') as never);
      await expect(service.onModuleInit()).rejects.toThrow('ECONNREFUSED');

      expect(sent().map(({ command }) => command)).toEqual([
        HeadBucketCommand.name,
        HeadBucketCommand.name,
      ]);
    });
  });
});
