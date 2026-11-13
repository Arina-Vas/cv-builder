import { Departments } from '@/features/departments/components/Departments';
import { Suspense } from 'react';

export default function DepartmentsPage() {
  return (
    <Suspense>
      <Departments />
    </Suspense>
  );
}
