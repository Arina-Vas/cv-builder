export interface CvProjectRow {
  id: string;
  name: string;
  domain: string;
  startDate: string;
  // null = the project is still going on ("Till now")
  endDate: string | null;
  description: string;
  responsibilities: string[];
}

export const cvProjects: CvProjectRow[] = [
  {
    id: '1',
    name: 'SaaS Media Platform',
    domain: 'IoT (Internet of Things)',
    startDate: '2023-09-21',
    endDate: null,
    description:
      'A digital music, podcast, and video service that gives you access to millions of songs and other content from creators all over the world.',
    responsibilities: ['Managed to write code in time'],
  },
  {
    id: '2',
    name: 'Business Process Automation',
    domain: 'Automation',
    startDate: '2023-01-20',
    endDate: '2023-06-19',
    description:
      'A system for setting up business process automation. Includes work with webhooks, queues to third-party services and databases.',
    responsibilities: ['Did something great', 'Did not break production'],
  },
];
