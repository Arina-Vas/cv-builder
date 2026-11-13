-- The users table now keeps the storage key of the avatar instead of its full URL.
-- Rename in place; values that are full URLs (none were uploaded through the app) are not keys, so drop them.
ALTER TABLE "users" RENAME COLUMN "avatar_url" TO "avatar_key";
UPDATE "users" SET "avatar_key" = NULL WHERE "avatar_key" LIKE '%://%';
