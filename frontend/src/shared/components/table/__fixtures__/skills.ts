export interface SkillRow {
  id: string;
  name: string;
  type: string;
  category: string;
}

export const skills: SkillRow[] = [
  { id: '1', name: 'WebSockets', type: 'Backend', category: 'Backend Technologies' },
  { id: '2', name: 'Keycloak', type: 'Backend', category: 'Backend Technologies' },
  { id: '3', name: 'Firebase', type: 'Backend', category: 'Cloud' },
  { id: '4', name: 'PostgreSQL', type: 'Backend', category: 'Databases' },
  { id: '5', name: 'Redis', type: 'Backend', category: 'Databases' },
  { id: '6', name: 'NestJS', type: 'Backend', category: 'Backend Technologies' },
];
