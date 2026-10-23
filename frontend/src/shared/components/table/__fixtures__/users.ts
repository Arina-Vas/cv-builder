export interface UserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  avatarUrl?: string;
}

export const SAMPLE_AVATAR_URL =
  'https://img.magnific.com/free-vector/mysterious-mafia-man-smoking-cigarette_52683-34828.jpg?semt=ais_hybrid&w=740&q=80';

export const users: UserRow[] = [
  {
    id: '1',
    firstName: 'Rostislav',
    lastName: 'Harlanov',
    email: 'thorn_pear@icloud.com',
    department: 'React',
    position: 'Software Engineer',
  },
  {
    id: '2',
    firstName: 'Christopher',
    lastName: 'Nolan',
    email: 'christophernolan@gmail.com',
    department: 'Blockchain',
    position: 'DevOps Engineer',
    avatarUrl: SAMPLE_AVATAR_URL,
  },
  {
    id: '3',
    firstName: 'Artem',
    lastName: 'Lopatin',
    email: 'artsem.lapatsin@innowise.com',
    department: 'Global',
    position: 'Project Manager',
  },
];
