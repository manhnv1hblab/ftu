export type PreferenceRank = 'nv1' | 'nv2' | 'nv3';

export interface PreferredUniversity {
  universityId: string;
  universityName: string;
  selectedAt: string;
}

export type PreferredUniversities = Partial<Record<PreferenceRank, PreferredUniversity>>;
