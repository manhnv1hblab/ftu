import { StudentCourse } from './curriculum';

export interface StudentProfile {
  cohort: string; // e.g. "K62", "K63", "K64"
  major: string; // e.g. "Kinh tế đối ngoại", "Kinh tế quốc tế"
  program: 'Tiêu chuẩn' | 'CLC' | 'CTTT' | '';
  exchangeSemester: string; // "Học kỳ II năm học 2026 - 2027 (S27)"
  targetGraduationSemester: string; // e.g. "Học kỳ 2 - 2027-2028"
  
  // Academic Metrics
  gpa4: number; // minimum 2.8
  gpa10: number; // minimum 7.5
  completedSemesters: number; // minimum 2
  accumulatedCredits: number; // minimum 35
  
  // Eligibility Flags
  hasParticipatedSemesterExchange: boolean | null; // must be explicitly confirmed false
  isFinalSemester: boolean | null; // must be explicitly confirmed false
  hasExemplaryStudentAward: boolean | null; // bonus points for preferences, not for GPA threshold
  hasPassedMidtermInternship: boolean | null; // TTGK required for graduation thesis
  
  // Language
  languageCertificate: {
    language: string; // 'English' | 'French' | 'Japanese' | 'Chinese' | 'German'
    testName: string; // 'IELTS' | 'TOEFL iBT' | 'TOEFL ITP' | 'TOEIC' | 'VSTEP' | 'JLPT' | 'HSK' | 'CEFR B2'
    score: string; // e.g. "6.5", "7.0", "N2", "HSK 5"
    level: string; // 'B2' | 'C1' | 'C2'
    isValid: boolean;
    expiryDate?: string;
  };
  
  // Preferences & Budget
  monthlyBudgetVnd: number; // in VNĐ/month (e.g. 20_000_000)
  housingType: 'DORMITORY' | 'RENT' | 'ANY';
  stayDurationMonths: number; // default 5 months
  preferredRegions: string[]; // ['Asia', 'Europe', 'America', 'Oceania']
  
  // Courses Data
  courses: StudentCourse[];
  manualCourseCodes?: string[];
  isProfileComplete: boolean;
}
