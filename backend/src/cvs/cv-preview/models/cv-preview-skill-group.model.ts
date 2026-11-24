import { SkillCategory } from '@/skills/models/skill-category.model';
import { Field, ObjectType } from '@nestjs/graphql';
import { CvPreviewSkill } from './cv-preview-skill.model';

@ObjectType({
  description: 'CV skills of one category, sorted by skill name',
})
export class CvPreviewSkillGroup {
  @Field(() => SkillCategory)
  category!: SkillCategory;

  @Field(() => [CvPreviewSkill])
  skills!: CvPreviewSkill[];
}
