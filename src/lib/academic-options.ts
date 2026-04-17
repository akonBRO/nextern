export const ACADEMIC_UNIVERSITIES = [
  'BRAC University',
  'North South University (NSU)',
  'AIUB',
  'Independent University Bangladesh (IUB)',
  'East West University (EWU)',
  'Daffodil International University (DIU)',
  'ULAB',
  'United International University (UIU)',
  'KUET',
  'RUET',
  'CUET',
  'BUET',
  'SUST',
  'Dhaka University (DU)',
  'IUT',
] as const;

export const ACADEMIC_DEPARTMENTS = [
  'CSE',
  'EEE',
  'BBA',
  'MBA',
  'ECE',
  'Civil',
  'Architecture',
  'Pharmacy',
  'Law',
  'English',
  'Economics',
  'Finance',
  'Marketing',
  'Accounting',
] as const;

export type AcademicUniversity = (typeof ACADEMIC_UNIVERSITIES)[number];
export type AcademicDepartment = (typeof ACADEMIC_DEPARTMENTS)[number];
