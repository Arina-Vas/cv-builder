import { Module } from '@nestjs/common';
import { CvService } from '@/cvs/cv.service';
import { CvResolver } from '@/cvs/cv.resolver';
import { CvAccessService } from '@/cvs/cv-access.service';
import { CvProjectResolver } from '@/cvs/cv-projects/cv-project.resolver';
import { CvProjectService } from '@/cvs/cv-projects/cv-project.service';

@Module({
  providers: [CvResolver, CvService, CvAccessService, CvProjectResolver, CvProjectService],
  exports: [CvAccessService],
})
export class CvModule {}
