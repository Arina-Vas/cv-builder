export interface ProjectRow {
  id: string;
  name: string;
  domain: string;
  startDate: string;
  endDate: string;
  description: string;
  environment: string[];
}

export const projects: ProjectRow[] = [
  {
    id: '1',
    name: 'Blog',
    domain: 'Blogging',
    startDate: '2025-12-31',
    endDate: '2026-05-31',
    description:
      'A dynamic blogging website that provides users with a platform to create, publish and share written content.',
    environment: ['HTML5', 'CSS3', 'TypeScript', 'React', 'Zustand', 'Firebase'],
  },
  {
    id: '2',
    name: 'Cloud Sales Management',
    domain: 'CRM (Customer RM)',
    startDate: '2025-04-15',
    endDate: '2025-12-31',
    description:
      'This system offers numerous benefits for businesses looking to streamline operations and improve customer interactions.',
    environment: ['TypeScript', 'React', 'MobX'],
  },
];
