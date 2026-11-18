import { Module } from '@nestjs/common';
import { CvService } from '@/cvs/cv.service';
import { CvResolver } from '@/cvs/cv.resolver';
import { CvAccessService } from '@/cvs/cv-access.service';

@Module({
  providers: [CvResolver, CvService, CvAccessService],
  exports: [CvAccessService],
})
export class CvModule {}
