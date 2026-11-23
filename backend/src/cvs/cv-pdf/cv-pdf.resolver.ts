import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { AllowUnverified } from '@/common/auth/allow-unverified.decorator';
import { CvPdf } from '@/cvs/cv-pdf/models/cv-pdf.model';
import { CvPdfService } from '@/cvs/cv-pdf/cv-pdf.service';
import { User } from '@/users/models/user.model';
import { CurrentUser } from '@/common/auth/current-user.decorator';
import { ParseUUIDPipe } from '@nestjs/common';

@Resolver()
export class CvPdfResolver {
  constructor(private readonly cvPdfService: CvPdfService) {}
  @AllowUnverified()
  @Mutation(() => CvPdf, {
    description:
      'Own CV or Admin. Builds a PDF of the CV preview and returns it as base64. ' +
      'Fails with NOT_FOUND, FORBIDDEN for another user, BAD_USER_INPUT when preview data is incomplete',
  })
  generateCvPdf(
    @CurrentUser() user: User,
    @Args('cvId', { type: () => ID }, ParseUUIDPipe) cvId: string,
  ): Promise<CvPdf> {
    return this.cvPdfService.generate(cvId, user);
  }
}
