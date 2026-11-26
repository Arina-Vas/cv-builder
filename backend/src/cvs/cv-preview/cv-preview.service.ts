import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CvAccessService } from '@/cvs/cv-access.service';
import { notFound } from '@/common/errors/app-errors';
import type { User } from '@/users/models/user.model';
import type { CvPreview } from './models/cv-preview.model';
import { cvPreviewInclude, toCvPreview } from './cv-preview.mapper';

@Injectable()
export class CvPreviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cvAccess: CvAccessService,
  ) {}

  async getPreview(currentUser: User, cvId: string): Promise<CvPreview> {
    const cv = await this.cvAccess.getAccessibleCv(cvId, currentUser);

    const row = await this.prisma.cv.findUnique({
      where: { id: cvId },
      include: cvPreviewInclude(cv.userId),
    });

    if (!row) throw notFound('CV not found');

    return toCvPreview(row, new Date());
  }
}
