export interface StudentCourse {
  stt?: string;
  courseCode: string;
  courseName: string;
  program?: string;
  isCore?: boolean;
  credits: number;
  tuitionCredits?: number;
  isMandatory: boolean;
  isTaken: boolean;
  isPassed: boolean;
  electiveGroup?: string | null;
  electiveBranch?: string | null;
  minCredits?: number;
  maxCredits?: number;
  totalPeriods?: number;
  theoryPeriods?: number;
  practicePeriods?: number;
  suggestedSemester?: string;
  // User custom status when reviewing
  status?: 'PASSED' | 'IN_PROGRESS' | 'NOT_TAKEN';
  dataStatus?: 'VERIFIED' | 'NEEDS_VERIFICATION';
}

export interface ElectiveGroupProgress {
  groupCode: string;
  minCredits: number;
  maxCredits: number;
  passedCredits: number;
  remainingCredits: number;
  totalAvailableCourses: number;
  remainingCourses: StudentCourse[];
}
