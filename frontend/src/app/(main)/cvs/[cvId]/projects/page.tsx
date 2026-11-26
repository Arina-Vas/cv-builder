import { CvProjects } from '@/features/cv-projects/components/CvProjects';

interface CvProjectsPageProps {
  params: Promise<{ cvId: string }>;
}

export default async function CvProjectsPage({ params }: CvProjectsPageProps) {
  const { cvId } = await params;

  return <CvProjects cvId={cvId} />;
}
