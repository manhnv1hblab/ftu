export interface CostRange {
  min: number | null;
  max: number | null;
  raw: string;
  available?: boolean | null;
}

export interface CountryCost {
  country: string;
  livingCost: CostRange;
  dormitoryCost: CostRange;
  rentCost: CostRange;
  oneTimeDepositFee: number | null;
  requiresVerification: boolean;
  warningNote: string;
  source: {
    file: string;
    sheet: string;
    column: number;
  };
}

export type BudgetAssessment = 'WITHIN_BUDGET' | 'NEAR_BUDGET' | 'EXCEEDS_BUDGET' | 'NEEDS_VERIFICATION' | 'NO_DATA';

export interface BudgetEvaluation {
  status: BudgetAssessment;
  label: string;
  estimatedMonthlyMin: number;
  estimatedMonthlyMax: number;
  estimatedTotalMin: number;
  estimatedTotalMax: number;
  userMonthlyBudget: number;
  warning?: string;
}
