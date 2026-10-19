import { redirect } from 'next/navigation';

export default async function CvPage({ params }: { params: Promise<{ cvId: string }> }) {
  const { cvId } = await params;
  redirect(`/cvs/${cvId}/details`);
}
