-- Rules Prisma cannot express, see docs/data-model.md "Rules enforced outside Prisma".
ALTER TABLE "projects"
  ADD CONSTRAINT "projects_dates_check" CHECK ("start_date" <= "end_date");

ALTER TABLE "cv_projects"
  ADD CONSTRAINT "cv_projects_dates_check" CHECK ("end_date" IS NULL OR "start_date" <= "end_date");
