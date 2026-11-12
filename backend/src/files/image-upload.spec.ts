import { Readable } from 'node:stream';
import type { FileUpload } from 'graphql-upload-minimal';
import type { GraphQLError } from 'graphql';
import { ErrorCode } from '@/common/errors/error-code.enum';
import {
  detectImageType,
  ImageUploadMessage,
  MAX_IMAGE_BYTES,
  readImageUpload,
} from './image-upload';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xdb]);
const GIF87 = Buffer.from('GIF87a....', 'latin1');
const GIF89 = Buffer.from('GIF89a....', 'latin1');

const fileUpload = (createReadStream: () => Readable): FileUpload => ({
  filename: 'photo.png',
  fieldName: 'file',
  mimetype: 'image/png',
  encoding: '7bit',
  createReadStream: createReadStream as FileUpload['createReadStream'],
});

const fromChunks = (...chunks: Buffer[]) => fileUpload(() => Readable.from(chunks));

const rejection = (promise: Promise<unknown>): Promise<GraphQLError> =>
  promise.then(
    () => {
      throw new Error('expected the promise to reject');
    },
    (error: GraphQLError) => error,
  );

const fileErrorOf = (message: string) => ({
  code: ErrorCode.BAD_USER_INPUT,
  fields: [{ field: 'file', message }],
});

describe('detectImageType', () => {
  it.each([
    ['PNG', PNG, 'image/png', 'png'],
    ['JPEG', JPEG, 'image/jpeg', 'jpg'],
    ['GIF87a', GIF87, 'image/gif', 'gif'],
    ['GIF89a', GIF89, 'image/gif', 'gif'],
  ])('recognises %s by its first bytes', (_, body, contentType, extension) => {
    expect(detectImageType(body)).toEqual({ contentType, extension });
  });

  it.each([
    ['an empty file', Buffer.alloc(0)],
    ['text', Buffer.from('hello')],
    ['SVG', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>')],
    ['a cut PNG signature', PNG.subarray(0, 4)],
    ['WebP', Buffer.from('RIFF\x00\x00\x00\x00WEBP', 'latin1')],
  ])('rejects %s', (_, body) => {
    expect(detectImageType(body)).toBeNull();
  });
});

describe('readImageUpload', () => {
  it('joins the chunks and returns the detected type', async () => {
    await expect(readImageUpload(fromChunks(PNG.subarray(0, 3), PNG.subarray(3)))).resolves.toEqual(
      { body: PNG, contentType: 'image/png', extension: 'png' },
    );
  });

  it('accepts a file of exactly the limit', async () => {
    const body = Buffer.concat([JPEG, Buffer.alloc(MAX_IMAGE_BYTES - JPEG.length)]);

    await expect(readImageUpload(fromChunks(body))).resolves.toMatchObject({ extension: 'jpg' });
  });

  it('stops reading as soon as the file is over the limit', async () => {
    const stream = Readable.from([PNG, Buffer.alloc(MAX_IMAGE_BYTES), Buffer.alloc(10)]);
    const destroy = jest.spyOn(stream, 'destroy');

    const error = await rejection(readImageUpload(fileUpload(() => stream)));

    expect(error.extensions).toMatchObject(fileErrorOf(ImageUploadMessage.tooLarge));
    expect(destroy).toHaveBeenCalled();
  });

  it('treats a stream the parser marked as truncated as too large', async () => {
    const stream = Object.assign(Readable.from([PNG]), { truncated: true });

    const error = await rejection(readImageUpload(fileUpload(() => stream)));

    expect(error.extensions).toMatchObject(fileErrorOf(ImageUploadMessage.tooLarge));
  });

  it('turns the parser size error (HTTP 413) into the size message', async () => {
    const tooLarge = Object.assign(new Error('File truncated'), { status: 413 });

    const error = await rejection(
      readImageUpload(
        fileUpload(() => {
          throw tooLarge;
        }),
      ),
    );

    expect(error.extensions).toMatchObject(fileErrorOf(ImageUploadMessage.tooLarge));
  });

  it('lets other stream errors through', async () => {
    const broken = new Readable({
      read() {
        this.destroy(new Error('connection reset'));
      },
    });

    await expect(readImageUpload(fileUpload(() => broken))).rejects.toThrow('connection reset');
  });

  it('rejects content that is not a PNG, JPEG or GIF', async () => {
    const error = await rejection(readImageUpload(fromChunks(Buffer.from('<html>'))));

    expect(error.extensions).toMatchObject(fileErrorOf(ImageUploadMessage.invalidType));
  });
});
