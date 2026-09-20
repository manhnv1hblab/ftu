export type DataVerificationStatus = 'VERIFIED' | 'NEEDS_VERIFICATION' | 'NO_DATA';

export interface DataSourceRef {
  file: string;
  sheet?: string;
  row?: number;
  column?: number;
  block?: string;
  paragraph?: number;
  status?: DataVerificationStatus;
  extractedAt?: string;
  documentHash?: string;
  note?: string;
}

export interface SourceManifestEntry {
  file: string;
  purpose: string;
  required: boolean;
  status: DataVerificationStatus;
  documentHash?: string;
  checkedAt: string;
  note?: string;
}

