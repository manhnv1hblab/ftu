export interface CourseOffering {
  courseCode: string;
  courseName: string;
  credits: number;
  periods: number;
  classesCount: number;
  semester: 'HK1' | 'HK2';
  academicYear: string;
  cohortTarget: string;
  note?: string;
  source: {
    file: string;
    sheet: string;
    row: number;
    block?: string;
  };
}
