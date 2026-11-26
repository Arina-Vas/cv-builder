import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { cvInclude, CvWithUser } from '@/cvs/cv.mapper';
import { User } from '@/users/models/user.model';
import { forbidden, notFound } from '@/common/errors/app-errors';
import { canManageUser } from '@/common/auth/can-manage-user';

@Injectable()
export class CvAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async getAccessibleCv(cvId: string, currentUser: User): Promise<CvWithUser> {
    const cv = await this.prisma.cv.findUnique({ where: { id: cvId }, include: cvInclude });
    if (!cv) throw notFound('CV not found');
    if (!canManageUser(currentUser, cv.userId)) throw forbidden();
    return cv;
  }
}
