import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { AllowUnverified } from '@/common/auth/allow-unverified.decorator';
import { CvPdf } from '@/cvs/cv-pdf/models/cv-pdf.model';
import { NotImplementedException } from '@nestjs/common';

@Resolver()
export class CvPdfResolver {
  @AllowUnverified()
  @Mutation(() => CvPdf, {
    description:
      'Own CV or Admin. Builds a PDF of the CV preview and returns it as base64. ' +
      'Fails with NOT_FOUND, FORBIDDEN for another user, BAD_USER_INPUT when preview data is incomplete',
  })
  generateCvPdf(@Args('cvId', { type: () => ID }) _cvId: string): CvPdf {
    throw new NotImplementedException();
  }
}
