import { Readable } from 'node:stream';
import type { FileUpload } from 'graphql-upload-minimal';
import type { GraphQLError } from 'graphql';
import sharp from 'sharp';
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
  // Real images: the upload is decoded, so signature-only buffers are not enough here
  const picture = (width = 4, height = 2) =>
    sharp({ create: { width, height, channels: 3, background: '#ff0000' } });

  /** A phone-like photo: 4x2 pixels stored sideways (orientation 6) with a GPS position in EXIF */
  const phonePhoto = () =>
    picture()
      .jpeg()
      .withMetadata({ orientation: 6 })
      .withExifMerge({ IFD0: { Make: 'Phone' }, IFD3: { GPSLatitudeRef: 'N' } })
      .toBuffer();

  it('joins the chunks and returns the detected type', async () => {
    const png = await picture().png().toBuffer();

    const image = await readImageUpload(fromChunks(png.subarray(0, 3), png.subarray(3)));

    expect(image).toMatchObject({ contentType: 'image/png', extension: 'png' });
    await expect(sharp(image.body).metadata()).resolves.toMatchObject({
      format: 'png',
      width: 4,
      height: 2,
    });
  });

  it('accepts a file of exactly the limit', async () => {
    const jpeg = await picture().jpeg().toBuffer();
    const body = Buffer.concat([jpeg, Buffer.alloc(MAX_IMAGE_BYTES - jpeg.length)]);

    await expect(readImageUpload(fromChunks(body))).resolves.toMatchObject({ extension: 'jpg' });
  });

  it('strips EXIF with the GPS position from a photo', async () => {
    const photo = await phonePhoto();
    expect((await sharp(photo).metadata()).exif).toBeDefined();

    const { body } = await readImageUpload(fromChunks(photo));

    const metadata = await sharp(body).metadata();
    expect(metadata.exif).toBeUndefined();
    expect(body.includes(Buffer.from('Phone'))).toBe(false);
  });

  it('turns a sideways photo upright before dropping its orientation tag', async () => {
    const { body } = await readImageUpload(fromChunks(await phonePhoto()));

    const metadata = await sharp(body).metadata();
    expect(metadata).toMatchObject({ format: 'jpeg', width: 2, height: 4 });
    expect(metadata.orientation).toBeUndefined();
  });

  it('strips EXIF from a PNG', async () => {
    const png = await picture()
      .png()
      .withExif({ IFD0: { Make: 'Phone' } })
      .toBuffer();
    expect((await sharp(png).metadata()).exif).toBeDefined();

    const { body } = await readImageUpload(fromChunks(png));

    expect((await sharp(body).metadata()).exif).toBeUndefined();
  });

  it('keeps every frame of an animated GIF', async () => {
    const frame = (background: string) =>
      sharp({ create: { width: 2, height: 2, channels: 3, background } })
        .png()
        .toBuffer();
    const gif = await sharp([await frame('#ff0000'), await frame('#0000ff')], {
      join: { animated: true },
    })
      .gif()
      .toBuffer();

    const image = await readImageUpload(fromChunks(gif));

    expect(image).toMatchObject({ contentType: 'image/gif', extension: 'gif' });
    await expect(sharp(image.body).metadata()).resolves.toMatchObject({ format: 'gif', pages: 2 });
  });

  it.each([
    ['PNG', PNG],
    ['JPEG', JPEG],
    ['GIF', GIF89],
  ])('rejects a file that only starts like a %s', async (_, body) => {
    const error = await rejection(readImageUpload(fromChunks(body)));

    expect(error.extensions).toMatchObject(fileErrorOf(ImageUploadMessage.invalidType));
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
