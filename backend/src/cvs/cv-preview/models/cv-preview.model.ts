import { Cv } from '@/cvs/models/cv.model';
import { UserLanguage } from '@/languages/user-languages/models/user-language.model';
import { Field, ObjectType } from '@nestjs/graphql';
import { CvPreviewSkillGroup } from './cv-preview-skill-group.model';
import { CvProject } from '@/cvs/cv-projects/models/cv-project.model';

@ObjectType({
  description: 'Aggregated read-only data of one CV for the Preview tab and the PDF export',
})
export class CvPreview extends Cv {
  @Field(() => [UserLanguage], { description: "The CV owner's languages, sorted by language name" })
  languages!: UserLanguage[];

  @Field(() => [String], {
    description: 'Distinct domains of the CV projects, sorted alphabetically',
  })
  domains!: string[];

  @Field(() => [CvPreviewSkillGroup], {
    description:
      'CV skills grouped by category, categories sorted by name; empty categories are omitted',
  })
  skillGroups!: CvPreviewSkillGroup[];

  @Field(() => [CvProject], { description: 'CV projects, the latest start date first' })
  projects!: CvProject[];
}
