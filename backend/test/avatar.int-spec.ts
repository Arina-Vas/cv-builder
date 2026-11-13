import sharp from 'sharp';
import { UserRole } from '@/common/graphql/enums';
import { ImageUploadMessage, MAX_IMAGE_BYTES } from '@/files/image-upload';
import { createUser, signIn } from './utils/fixtures';
import { GqlClient } from './utils/graphql-client';
import { createTestApp, resetDatabase, type TestApp } from './utils/test-app';

const UPLOAD_AVATAR =
  'mutation ($userId: ID!, $file: Upload!) { uploadAvatar(userId: $userId, file: $file) { id avatarUrl } }';
const REMOVE_AVATAR = 'mutation ($userId: ID!) { removeAvatar(userId: $userId) { id avatarUrl } }';
const USER = 'query ($id: ID!) { user(id: $id) { avatarUrl } }';
const DELETE_USER = 'mutation ($id: ID!) { deleteUser(id: $id) }';

const MISSING_ID = '00000000-0000-4000-8000-000000000000';

const PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c48900000009704859' +
    '73000003e8000003e801b57b526b0000000d494441540899636060606000000005000187a14ed40000000049454e44ae426082',
  'hex',
);
// Real 1x1 images: the backend decodes every upload to strip its metadata
const JPEG = Buffer.from(
  'ffd8ffdb00430006040506050406060506070706080a100a0a09090a140e0f0c1017141818171416161a1d251f1a1b23' +
    '1c1616202c20232627292a29191f2d302d283025282928ffdb0043010707070a080a130a0a13281a161a28282828282828' +
    '28282828282828282828282828282828282828282828282828282828282828282828282828282828282828ffc000110800' +
    '01000103012200021101031101ffc4001500010100000000000000000000000000000007ffc4001410010000000000000000' +
    '0000000000000000ffc4001501010100000000000000000000000000000608ffc4001411010000000000000000000000000000' +
    '0000ffda000c03010002110311003f009d001ca45fffd9',
  'hex',
);
const GIF = Buffer.from(
  '474946383961010001008000004c6971ff000021f90405000000002c00000000010001000002024c01003b',
  'hex',
);

interface AvatarResult {
  uploadAvatar: { id: string; avatarUrl: string | null };
}

describe('Avatar (integration)', () => {
  let t: TestApp;

  const signedIn = async (role: UserRole = UserRole.EMPLOYEE, verified = true) => {
    const user = await createUser(t.prisma, { role, verified });
    const browser = new GqlClient(t.server);
    await signIn(browser, user.email);
    return { browser, user };
  };

  const storedKey = async (id: string) =>
    (await t.prisma.user.findUniqueOrThrow({ where: { id }, select: { avatarKey: true } }))
      .avatarKey;

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(t.prisma);
    t.storage.files.clear();
  });

  afterAll(async () => {
    await t.app.close();
  });

  describe('uploadAvatar', () => {
    it.each([
      ['PNG', PNG, 'png', 'image/png'],
      ['JPEG', JPEG, 'jpg', 'image/jpeg'],
      ['GIF', GIF, 'gif', 'image/gif'],
    ])('stores an own %s and returns its public URL', async (_, body, extension, contentType) => {
      const { browser, user } = await signedIn();

      const { status, body: response } = await browser.upload<AvatarResult>(
        UPLOAD_AVATAR,
        { userId: user.id },
        { body, filename: `photo.${extension}`, contentType },
      );

      expect(status).toBe(200);
      const key = await storedKey(user.id);
      expect(key).toMatch(new RegExp(`\\.${extension}$`));
      expect(response.data?.uploadAvatar).toEqual({
        id: user.id,
        avatarUrl: `http://storage.test/${key}`,
      });
      expect(t.storage.files.get(key ?? '')).toMatchObject({ contentType });
    });

    it('takes the type from the content, not from the name or the MIME type', async () => {
      const { browser, user } = await signedIn();

      await browser.upload(
        UPLOAD_AVATAR,
        { userId: user.id },
        { body: PNG, filename: 'photo.gif', contentType: 'image/gif' },
      );

      const key = await storedKey(user.id);
      expect(key).toMatch(/\.png$/);
      expect(t.storage.files.get(key ?? '')?.contentType).toBe('image/png');
    });

    it('stores a photo without its EXIF (GPS position, camera)', async () => {
      const { browser, user } = await signedIn();
      const photo = await sharp({
        create: { width: 2, height: 2, channels: 3, background: '#ff0000' },
      })
        .jpeg()
        .withExif({ IFD0: { Make: 'Phone' }, IFD3: { GPSLatitudeRef: 'N' } })
        .toBuffer();

      await browser.upload(
        UPLOAD_AVATAR,
        { userId: user.id },
        { body: photo, filename: 'photo.jpg', contentType: 'image/jpeg' },
      );

      const stored = t.storage.files.get((await storedKey(user.id)) ?? '');
      expect(stored?.contentType).toBe('image/jpeg');
      expect((await sharp(stored?.body).metadata()).exif).toBeUndefined();
    });

    it('rejects a file that only pretends to be an image', async () => {
      const { browser, user } = await signedIn();

      const { body } = await browser.upload(
        UPLOAD_AVATAR,
        { userId: user.id },
        {
          body: Buffer.from('<svg onload="alert(1)"/>'),
          filename: 'x.png',
          contentType: 'image/png',
        },
      );

      expect(body.errors?.[0]?.extensions).toMatchObject({
        code: 'BAD_USER_INPUT',
        fields: [{ field: 'file', message: ImageUploadMessage.invalidType }],
      });
      expect(await storedKey(user.id)).toBeNull();
      expect(t.storage.files.size).toBe(0);
    });

    it('accepts exactly 5 MB and rejects a larger file', async () => {
      const { browser, user } = await signedIn();
      const fiveMb = Buffer.concat([PNG, Buffer.alloc(MAX_IMAGE_BYTES - PNG.length)]);

      const accepted = await browser.upload(
        UPLOAD_AVATAR,
        { userId: user.id },
        { body: fiveMb, filename: 'big.png' },
      );
      const rejected = await browser.upload(
        UPLOAD_AVATAR,
        { userId: user.id },
        { body: Buffer.concat([fiveMb, Buffer.from([0])]), filename: 'bigger.png' },
      );

      expect(accepted.body.errors).toBeUndefined();
      expect(rejected.body.errors?.[0]?.extensions).toMatchObject({
        code: 'BAD_USER_INPUT',
        fields: [{ field: 'file', message: ImageUploadMessage.tooLarge }],
      });
      expect(t.storage.files.size).toBe(1);
    });

    it('rejects a file far over the limit that the upload parser cuts off', async () => {
      const { browser, user } = await signedIn();
      const sixMb = Buffer.concat([PNG, Buffer.alloc(6 * 1024 * 1024)]);

      const { body } = await browser.upload(
        UPLOAD_AVATAR,
        { userId: user.id },
        { body: sixMb, filename: 'huge.png' },
      );

      expect(body.errors?.[0]?.extensions).toMatchObject({
        code: 'BAD_USER_INPUT',
        fields: [{ field: 'file', message: ImageUploadMessage.tooLarge }],
      });
      expect(await storedKey(user.id)).toBeNull();
    });

    it('replaces the avatar and deletes the old file', async () => {
      const { browser, user } = await signedIn();
      await browser.upload(UPLOAD_AVATAR, { userId: user.id }, { body: PNG, filename: 'a.png' });
      const first = await storedKey(user.id);

      await browser.upload(UPLOAD_AVATAR, { userId: user.id }, { body: GIF, filename: 'b.gif' });

      const second = await storedKey(user.id);
      expect(second).not.toBe(first);
      expect([...t.storage.files.keys()]).toEqual([second]);
    });

    it("keeps an employee away from another user's avatar", async () => {
      const { browser } = await signedIn();
      const other = await createUser(t.prisma);

      const { body } = await browser.upload(
        UPLOAD_AVATAR,
        { userId: other.id },
        { body: PNG, filename: 'a.png' },
      );

      expect(body.errors?.[0]?.extensions.code).toBe('FORBIDDEN');
      expect(t.storage.files.size).toBe(0);
    });

    it("lets an admin change anyone's avatar", async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const other = await createUser(t.prisma);

      const { body } = await browser.upload<AvatarResult>(
        UPLOAD_AVATAR,
        { userId: other.id },
        { body: PNG, filename: 'a.png' },
      );

      expect(body.data?.uploadAvatar.avatarUrl).toMatch(/^http:\/\/storage\.test\/.+\.png$/);
    });

    it('reports a user that does not exist and stores nothing', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);

      const { body } = await browser.upload(
        UPLOAD_AVATAR,
        { userId: MISSING_ID },
        { body: PNG, filename: 'a.png' },
      );

      expect(body.errors?.[0]?.extensions.code).toBe('NOT_FOUND');
      expect(t.storage.files.size).toBe(0);
    });

    it('is closed to a user with an unverified email', async () => {
      const { browser, user } = await signedIn(UserRole.EMPLOYEE, false);

      const { body } = await browser.upload(
        UPLOAD_AVATAR,
        { userId: user.id },
        { body: PNG, filename: 'a.png' },
      );

      expect(body.errors?.[0]?.extensions.code).toBe('EMAIL_NOT_VERIFIED');
    });

    it('requires authentication', async () => {
      const user = await createUser(t.prisma);

      const { body } = await new GqlClient(t.server).upload(
        UPLOAD_AVATAR,
        { userId: user.id },
        { body: PNG, filename: 'a.png' },
      );

      expect(body.errors?.[0]?.extensions.code).toBe('UNAUTHENTICATED');
    });

    it('refuses a multipart request without the CSRF preflight header', async () => {
      const { browser, user } = await signedIn();

      const { status } = await browser.upload(
        UPLOAD_AVATAR,
        { userId: user.id },
        { body: PNG, filename: 'a.png' },
        { preflight: false },
      );

      expect(status).toBe(400);
      expect(await storedKey(user.id)).toBeNull();
    });
  });

  describe('removeAvatar', () => {
    it('clears the avatar and deletes its file', async () => {
      const { browser, user } = await signedIn();
      await browser.upload(UPLOAD_AVATAR, { userId: user.id }, { body: PNG, filename: 'a.png' });

      const { removeAvatar } = await browser.data<{ removeAvatar: { avatarUrl: string | null } }>(
        REMOVE_AVATAR,
        { userId: user.id },
      );

      expect(removeAvatar.avatarUrl).toBeNull();
      expect(await storedKey(user.id)).toBeNull();
      expect(t.storage.files.size).toBe(0);
    });

    it("keeps an employee away from another user's avatar", async () => {
      const { browser } = await signedIn();
      const other = await createUser(t.prisma);

      const error = await browser.error(REMOVE_AVATAR, { userId: other.id });

      expect(error.extensions.code).toBe('FORBIDDEN');
    });
  });

  it('returns no URL for a user without an avatar', async () => {
    const { browser, user } = await signedIn();

    const { user: found } = await browser.data<{ user: { avatarUrl: string | null } }>(USER, {
      id: user.id,
    });

    expect(found.avatarUrl).toBeNull();
  });

  it('deletes the avatar file together with the user', async () => {
    const { browser: admin } = await signedIn(UserRole.ADMIN);
    const { browser, user } = await signedIn();
    await browser.upload(UPLOAD_AVATAR, { userId: user.id }, { body: PNG, filename: 'a.png' });

    await admin.data(DELETE_USER, { id: user.id });

    expect(t.storage.files.size).toBe(0);
  });
});
