import { graphql } from '@/gql';

graphql(`
  fragment CvPdfFields on CvPdf {
    content
    fileName
  }
`);

export const GENERATE_CV_PDF = graphql(`
  mutation GenerateCvPdf($input: GenerateCvPdfInput!) {
    generateCvPdf(input: $input) {
      ...CvPdfFields
    }
  }
`);
