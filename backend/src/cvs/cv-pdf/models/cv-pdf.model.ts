import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CvPdf {
  @Field()
  fileName!: string;

  @Field({ description: 'PDF file encoded as base64' })
  content!: string;
}
