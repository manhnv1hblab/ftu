import { CourseEquivalence } from './equivalence';
import { PartnerUniversity } from './university';
import { BudgetEvaluation } from './cost';
import { DataSourceRef } from './provenance';

export interface CourseMatchPair {
  ftuCourseCode: string;
  ftuCourseName: string;
  ftuCredits: number;
  hostCourseCode: string;
  hostCourseName: string;
  hostCredits?: number;
  equivalenceId: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'UNCERTAIN';
  faculty?: string;
  approver?: string;
  approvalYear?: string;
  // Offering schedule in FTU 2026-2027 if available
  offeredInSemester?: ('HK1' | 'HK2')[];
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  riskReason?: string;
  program?: string;
}

export interface UniversityMatchResult {
  university: PartnerUniversity;
  matchedPairs: CourseMatchPair[];
  approvedPairsCount: number; // must be >= 3 to qualify
  pendingPairsCount: number;
  totalMatchCount: number;
  meetsEligibility: boolean;
  missingRequirements: string[];
  budgetEvaluation: BudgetEvaluation;
  recommendationScore: number;
  recommendationReasons: string[];
  dataStatus: 'VERIFIED' | 'NEEDS_VERIFICATION' | 'NO_DATA';
  sources: DataSourceRef[];
}

export interface SelectedStudyPlan {
  universityId: string;
  universityName: string;
  status?: 'VALID' | 'DRAFT_NOT_ELIGIBLE' | 'NEEDS_VERIFICATION';
  savedAt?: string;
  sources?: DataSourceRef[];
  // At least 3 transferred FTU courses
  transferredCourses: CourseMatchPair[];
  // Additional host courses to reach >= 5 courses at host
  hostAdditionalCourses?: {
    hostCourseName: string;
    hostCourseCode?: string;
    estimatedCredits?: number;
    note?: string;
  }[];
  // Risk simulations
  untransferredCourseRiskTest?: string[]; // test what happens if course X fails transfer
  graduationSimulation?: {
    remainingCreditsAfterExchange: number;
    remainingMandatoryCourses: string[];
    thesisEligible: boolean; // remaining credits <= 6 excluding thesis/PE/military
    hasMidtermInternship: boolean;
    canGraduateOnTime: boolean;
    riskWarnings: string[];
  };
}

export interface SavedPlanDraft {
  version: string;
  dataVersion: string;
  updatedAt: string;
  profile: any;
  rankedChoices: {
    nv1?: SelectedStudyPlan;
    nv2?: SelectedStudyPlan;
    nv3?: SelectedStudyPlan;
  };
}
