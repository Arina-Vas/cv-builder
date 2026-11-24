-- A CV keeps its own mastery per skill; existing rows start from the owner's current level.
ALTER TABLE "cv_skills" ADD COLUMN "mastery" "Mastery";

UPDATE "cv_skills" cs
SET "mastery" = us."mastery"
FROM "cvs" c, "user_skills" us
WHERE c."id" = cs."cv_id"
  AND us."user_id" = c."user_id"
  AND us."skill_id" = cs."skill_id";

-- Rows without the owner's skill were never listed and have no level to copy.
DELETE FROM "cv_skills" WHERE "mastery" IS NULL;

ALTER TABLE "cv_skills" ALTER COLUMN "mastery" SET NOT NULL;
