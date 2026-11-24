import { Module } from '@nestjs/common';
import { CvService } from '@/cvs/cv.service';
import { CvResolver } from '@/cvs/cv.resolver';
import { CvAccessService } from '@/cvs/cv-access.service';
import { CvProjectResolver } from '@/cvs/cv-projects/cv-project.resolver';
import { CvProjectService } from '@/cvs/cv-projects/cv-project.service';
import { CvSkillResolver } from './cv-skills/cv-skill.resolver';
import { CvSkillService } from './cv-skills/cv-skill.service';
import { CvPdfResolver } from '@/cvs/cv-pdf/cv-pdf.resolver';
import { CvPdfService } from '@/cvs/cv-pdf/cv-pdf.service';
import { CvPreviewResolver } from './cv-preview/cv-preview.resolver';
import { CvPreviewService } from './cv-preview/cv-preview.service';

@Module({
  providers: [
    CvResolver,
    CvSkillResolver,
    CvProjectResolver,
    CvService,
    CvAccessService,
    CvProjectService,
    CvSkillService,
    CvPdfResolver,
    CvPdfService,
    CvPreviewResolver,
    CvPreviewService,
  ],
  exports: [CvAccessService, CvPreviewService],
})
export class CvModule {}
