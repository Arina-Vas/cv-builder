import { Projects } from '@/features/projects/components/Projects';
import { Suspense } from 'react';

export default function ProjectsPage() {
  return (
    <Suspense>
      <Projects />
    </Suspense>
  );
}
