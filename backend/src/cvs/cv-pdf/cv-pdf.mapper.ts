import { type CvWithUser } from '@/cvs/cv.mapper';
import { type CvPdfData } from '@/cvs/cv-pdf/cv-preview.types';

export const toCvPdfData = (cv: CvWithUser): CvPdfData => ({
  id: cv.id,
  name: cv.name,
  education: cv.education,
  description: cv.description,
  user: {
    email: cv.user.email,
    firstName: cv.user.firstName,
    lastName: cv.user.lastName,
    position: cv.user.position && { id: cv.user.position.id, name: cv.user.position.name },
  },
  languages: [],
  domains: [],
  skillGroups: [],
  projects: [],
});
