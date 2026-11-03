-- Rename in place: keeps existing rows and the order of values.
-- ADVANCED is freed first because the 4th value takes its name.
ALTER TYPE "Mastery" RENAME VALUE 'ADVANCED' TO 'ELEMENTARY';
ALTER TYPE "Mastery" RENAME VALUE 'NOVICE' TO 'BEGINNER';
ALTER TYPE "Mastery" RENAME VALUE 'COMPETENT' TO 'INTERMEDIATE';
ALTER TYPE "Mastery" RENAME VALUE 'PROFICIENT' TO 'ADVANCED';
