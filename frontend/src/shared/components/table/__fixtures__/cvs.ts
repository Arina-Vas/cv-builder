export interface CvRow {
  id: string;
  name: string;
  education: string;
  employeeEmail: string;
  description: string;
}

export const cvs: CvRow[] = [
  {
    id: '1',
    name: 'Software Engineer with 5+ years of experience',
    education: 'Computer Systems Design',
    employeeEmail: 'thorn_pear@icloud.com',
    description:
      'Highly motivated and experienced Software Engineer with 5+ years of proven success in leading and developing robust and scalable applications.',
  },
  {
    id: '2',
    name: 'Frontend Developer',
    education: 'Applied Mathematics',
    employeeEmail: 'christophernolan@gmail.com',
    description:
      'Frontend developer focused on accessible, responsive interfaces built with React and TypeScript.',
  },
];
