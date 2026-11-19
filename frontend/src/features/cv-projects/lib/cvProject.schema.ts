import {
  optionalString,
  requiredDate,
  requiredIds,
  requiredString,
  type ValidationT,
} from '@/shared/lib/form';
import { z } from 'zod';

const RESPONSIBILITIES_MAX = 2000;

export type ProjectPeriod = { startDate: Date; endDate: Date };

const isWithin = (date: Date, period: ProjectPeriod) =>
  date >= period.startDate && date <= period.endDate;

export const cvProjectSchema = (
  t: ValidationT,
  periodOf: (projectId: string) => ProjectPeriod | undefined,
) =>
  z
    .object({
      projectId: requiredString(t('cvProject.projectId.required')),
      startDate: requiredDate(t('cvProject.startDate.required')),
      endDate: z.date().nullable(),
      roleIds: requiredIds(t('cvProject.roleIds.required')),
      responsibilities: optionalString().max(RESPONSIBILITIES_MAX, {
        error: t('cvProject.responsibilities.maxLength', { max: RESPONSIBILITIES_MAX }),
      }),
    })
    .superRefine((v, ctx) => {
      if (!v.startDate) return;

      const period = periodOf(v.projectId);

      if (period && !isWithin(v.startDate, period)) {
        ctx.addIssue({
          code: 'custom',
          path: ['startDate'],
          message: t('cvProject.startDate.outOfProject'),
        });
      }

      if (!v.endDate) return;

      if (v.endDate < v.startDate) {
        ctx.addIssue({
          code: 'custom',
          path: ['endDate'],
          message: t('cvProject.endDate.beforeStart'),
        });
      } else if (period && !isWithin(v.endDate, period)) {
        ctx.addIssue({
          code: 'custom',
          path: ['endDate'],
          message: t('cvProject.endDate.outOfProject'),
        });
      }
    });

export type CvProjectFormValues = z.output<ReturnType<typeof cvProjectSchema>>;
