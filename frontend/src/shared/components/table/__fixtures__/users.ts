export interface UserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
}

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
