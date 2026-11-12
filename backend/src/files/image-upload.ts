import type { FileUpload } from 'graphql-upload-minimal';
import { badUserInput } from '@/common/errors/app-errors';
import type { StoredFile } from './storage.service';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const ImageUploadMessage = {
  tooLarge: 'File size must not exceed 5 MB',
  invalidType: 'Only PNG, JPG, JPEG and GIF images are allowed',
} as const;

interface ImageType {
  contentType: string;
  extension: string;
  signatures: number[][];
}

const IMAGE_TYPES: ImageType[] = [
  {
    contentType: 'image/png',
    extension: 'png',
    signatures: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  },
  { contentType: 'image/jpeg', extension: 'jpg', signatures: [[0xff, 0xd8, 0xff]] },
  {
    contentType: 'image/gif',
    extension: 'gif',
    signatures: [
      [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
      [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
    ],
  },
];

export const detectImageType = (body: Buffer): Omit<ImageType, 'signatures'> | null => {
  const type = IMAGE_TYPES.find(({ signatures }) =>
    signatures.some((signature) => signature.every((byte, index) => body[index] === byte)),
  );
  return type ? { contentType: type.contentType, extension: type.extension } : null;
};

const fileError = (message: string) => badUserInput([{ field: 'file', message }]);

const isSizeLimitError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'status' in error && error.status === 413;

/**
 * Reads an uploaded image into memory and checks its real type and size.
 * Fails with BAD_USER_INPUT (field: file) if the file is too large or is not a PNG, JPEG or GIF.
 */
export async function readImageUpload(upload: FileUpload): Promise<StoredFile> {
  const chunks: Buffer[] = [];
  let size = 0;

  try {
    const stream = upload.createReadStream();
    for await (const chunk of stream as AsyncIterable<Buffer>) {
      size += chunk.length;
      if (size > MAX_IMAGE_BYTES) {
        stream.destroy();
        throw fileError(ImageUploadMessage.tooLarge);
      }
      chunks.push(chunk);
    }
    if ((stream as { truncated?: boolean }).truncated) {
      throw fileError(ImageUploadMessage.tooLarge);
    }
  } catch (error) {
    if (isSizeLimitError(error)) {
      throw fileError(ImageUploadMessage.tooLarge);
    }
    throw error;
  }

  const body = Buffer.concat(chunks);
  const type = detectImageType(body);
  if (!type) {
    throw fileError(ImageUploadMessage.invalidType);
  }
  return { body, ...type };
}
