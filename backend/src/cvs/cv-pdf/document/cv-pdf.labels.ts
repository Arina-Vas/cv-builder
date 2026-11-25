import { Proficiency } from '@/common/graphql/enums';
import { Locale } from '@/common/graphql/locale.enum';

/**
 * Texts of the CV PDF: `cvs.preview.document` and `userLanguage.proficiencyLevel` from
 * `frontend/messages/<locale>.json`, so the PDF reads like the CV Preview in the same UI language.
 * `cv-pdf.labels.spec.ts` keeps them equal to the frontend messages.
 */
export interface CvPdfLabels {
  sections: {
    education: string;
    languages: string;
    domains: string;
    projects: string;
    professionalSkills: string;
  };
  /** Template with `{language}` and `{level}` */
  languageLevel: string;
  project: { roles: string; period: string; responsibilities: string; environment: string };
  /** Template with `{start}` and `{end}` */
  period: string;
  present: string;
  skillsTable: {
    skills: string;
    category: string;
    skill: string;
    experience: string;
    lastUsed: string;
  };
  proficiency: Record<Proficiency, string>;
}

export const CV_PDF_LABELS: Record<Locale, CvPdfLabels> = {
  en: {
    sections: {
      education: 'Education',
      languages: 'Language proficiency',
      domains: 'Domains',
      projects: 'Projects',
      professionalSkills: 'Professional skills',
    },
    languageLevel: '{language} — {level}',
    project: {
      roles: 'Project roles',
      period: 'Period',
      responsibilities: 'Responsibilities',
      environment: 'Environment',
    },
    period: '{start} – {end}',
    present: 'Present',
    skillsTable: {
      skills: 'Skills',
      category: 'Skill category',
      skill: 'Skill',
      experience: 'Experience in years',
      lastUsed: 'Last used',
    },
    proficiency: {
      A1: 'A1',
      A2: 'A2',
      B1: 'B1',
      B2: 'B2',
      C1: 'C1',
      C2: 'C2',
      NATIVE: 'Native',
    },
  },
  de: {
    sections: {
      education: 'Ausbildung',
      languages: 'Sprachkenntnisse',
      domains: 'Domänen',
      projects: 'Projekte',
      professionalSkills: 'Fachliche Kompetenzen',
    },
    languageLevel: '{language} — {level}',
    project: {
      roles: 'Projektrollen',
      period: 'Zeitraum',
      responsibilities: 'Aufgaben',
      environment: 'Technologien',
    },
    period: '{start} – {end}',
    present: 'heute',
    skillsTable: {
      skills: 'Kompetenzen',
      category: 'Kompetenzkategorie',
      skill: 'Kompetenz',
      experience: 'Erfahrung in Jahren',
      lastUsed: 'Zuletzt verwendet',
    },
    proficiency: {
      A1: 'A1',
      A2: 'A2',
      B1: 'B1',
      B2: 'B2',
      C1: 'C1',
      C2: 'C2',
      NATIVE: 'Muttersprache',
    },
  },
  es: {
    sections: {
      education: 'Formación',
      languages: 'Idiomas',
      domains: 'Dominios',
      projects: 'Proyectos',
      professionalSkills: 'Habilidades profesionales',
    },
    languageLevel: '{language} — {level}',
    project: {
      roles: 'Roles en el proyecto',
      period: 'Período',
      responsibilities: 'Responsabilidades',
      environment: 'Entorno',
    },
    period: '{start} – {end}',
    present: 'actualidad',
    skillsTable: {
      skills: 'Habilidades',
      category: 'Categoría de habilidades',
      skill: 'Habilidad',
      experience: 'Experiencia (años)',
      lastUsed: 'Último uso',
    },
    proficiency: {
      A1: 'A1',
      A2: 'A2',
      B1: 'B1',
      B2: 'B2',
      C1: 'C1',
      C2: 'C2',
      NATIVE: 'Nativo',
    },
  },
  fr: {
    sections: {
      education: 'Formation',
      languages: 'Langues',
      domains: 'Domaines',
      projects: 'Projets',
      professionalSkills: 'Compétences professionnelles',
    },
    languageLevel: '{language} — {level}',
    project: {
      roles: 'Rôles sur le projet',
      period: 'Période',
      responsibilities: 'Responsabilités',
      environment: 'Environnement technique',
    },
    period: '{start} – {end}',
    present: "aujourd'hui",
    skillsTable: {
      skills: 'Compétences',
      category: 'Catégorie de compétences',
      skill: 'Compétence',
      experience: 'Expérience (années)',
      lastUsed: 'Dernière utilisation',
    },
    proficiency: {
      A1: 'A1',
      A2: 'A2',
      B1: 'B1',
      B2: 'B2',
      C1: 'C1',
      C2: 'C2',
      NATIVE: 'Langue maternelle',
    },
  },
  it: {
    sections: {
      education: 'Istruzione',
      languages: 'Conoscenze linguistiche',
      domains: 'Domini',
      projects: 'Progetti',
      professionalSkills: 'Competenze professionali',
    },
    languageLevel: '{language} — {level}',
    project: {
      roles: 'Ruoli nel progetto',
      period: 'Periodo',
      responsibilities: 'Responsabilità',
      environment: 'Tecnologie',
    },
    period: '{start} – {end}',
    present: 'oggi',
    skillsTable: {
      skills: 'Competenze',
      category: 'Categoria di competenze',
      skill: 'Competenza',
      experience: 'Esperienza (anni)',
      lastUsed: 'Ultimo utilizzo',
    },
    proficiency: {
      A1: 'A1',
      A2: 'A2',
      B1: 'B1',
      B2: 'B2',
      C1: 'C1',
      C2: 'C2',
      NATIVE: 'Madrelingua',
    },
  },
  uk: {
    sections: {
      education: 'Освіта',
      languages: 'Володіння мовами',
      domains: 'Домени',
      projects: 'Проєкти',
      professionalSkills: 'Професійні навички',
    },
    languageLevel: '{language} — {level}',
    project: {
      roles: 'Ролі в проєкті',
      period: 'Період',
      responsibilities: "Обов'язки",
      environment: 'Технології',
    },
    period: '{start} – {end}',
    present: 'дотепер',
    skillsTable: {
      skills: 'Навички',
      category: 'Категорія навичок',
      skill: 'Навичка',
      experience: 'Досвід (років)',
      lastUsed: 'Останнє використання',
    },
    proficiency: {
      A1: 'A1',
      A2: 'A2',
      B1: 'B1',
      B2: 'B2',
      C1: 'C1',
      C2: 'C2',
      NATIVE: 'Рідна',
    },
  },
  ru: {
    sections: {
      education: 'Образование',
      languages: 'Владение языками',
      domains: 'Домены',
      projects: 'Проекты',
      professionalSkills: 'Профессиональные навыки',
    },
    languageLevel: '{language} — {level}',
    project: {
      roles: 'Роли в проекте',
      period: 'Период',
      responsibilities: 'Обязанности',
      environment: 'Технологии',
    },
    period: '{start} – {end}',
    present: 'по настоящее время',
    skillsTable: {
      skills: 'Навыки',
      category: 'Категория навыков',
      skill: 'Навык',
      experience: 'Опыт (лет)',
      lastUsed: 'Последнее использование',
    },
    proficiency: {
      A1: 'A1',
      A2: 'A2',
      B1: 'B1',
      B2: 'B2',
      C1: 'C1',
      C2: 'C2',
      NATIVE: 'Родной',
    },
  },
  pl: {
    sections: {
      education: 'Wykształcenie',
      languages: 'Znajomość języków',
      domains: 'Domeny',
      projects: 'Projekty',
      professionalSkills: 'Umiejętności zawodowe',
    },
    languageLevel: '{language} — {level}',
    project: {
      roles: 'Role w projekcie',
      period: 'Okres',
      responsibilities: 'Obowiązki',
      environment: 'Technologie',
    },
    period: '{start} – {end}',
    present: 'obecnie',
    skillsTable: {
      skills: 'Umiejętności',
      category: 'Kategoria umiejętności',
      skill: 'Umiejętność',
      experience: 'Doświadczenie (lata)',
      lastUsed: 'Ostatnio używane',
    },
    proficiency: {
      A1: 'A1',
      A2: 'A2',
      B1: 'B1',
      B2: 'B2',
      C1: 'C1',
      C2: 'C2',
      NATIVE: 'Ojczysty',
    },
  },
  pt: {
    sections: {
      education: 'Formação',
      languages: 'Idiomas',
      domains: 'Domínios',
      projects: 'Projetos',
      professionalSkills: 'Competências profissionais',
    },
    languageLevel: '{language} — {level}',
    project: {
      roles: 'Funções no projeto',
      period: 'Período',
      responsibilities: 'Responsabilidades',
      environment: 'Tecnologias',
    },
    period: '{start} – {end}',
    present: 'atual',
    skillsTable: {
      skills: 'Competências',
      category: 'Categoria de competências',
      skill: 'Competência',
      experience: 'Experiência (anos)',
      lastUsed: 'Último uso',
    },
    proficiency: {
      A1: 'A1',
      A2: 'A2',
      B1: 'B1',
      B2: 'B2',
      C1: 'C1',
      C2: 'C2',
      NATIVE: 'Nativo',
    },
  },
};
