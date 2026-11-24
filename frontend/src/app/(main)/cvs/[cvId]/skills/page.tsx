import { CvSkills } from '@/features/cv-skills/components/CvSkills';

interface CvSkillsPageProps {
  params: Promise<{ cvId: string }>;
}

export default async function CvSkillsPage({ params }: CvSkillsPageProps) {
  const { cvId } = await params;

  return <CvSkills cvId={cvId} />;
}
