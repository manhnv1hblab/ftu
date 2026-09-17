export type EquivalenceStatus = 'APPROVED' | 'PENDING' | 'REJECTED' | 'UNCERTAIN';

export interface CourseEquivalence {
  id: string;
  partnerUni: string;
  partnerS27Id?: string;
  region: string;
  country: string;
  hostCourseName: string;
  hostCourseCode: string;
  ftuCourseNameRaw: string;
  ftuCourseNameClean: string;
  ftuCourseCodeRaw: string;
  ftuCourseCodes: string[];
  curriculum: string;
  faculty: string;
  approver: string;
  approvalYear: string;
  status: EquivalenceStatus;
  source: {
    file: string;
    sheet: string;
    row: number;
  };
}
