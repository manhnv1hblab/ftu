'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { StudentProfile } from '../types/studentProfile';
import { StudentCourse } from '../types/curriculum';
import { SelectedStudyPlan } from '../types/studyPlan';
import { PreferredUniversities, PreferenceRank, PreferredUniversity } from '../types/preference';
import sampleCurriculumData from '../../data/sample_curriculum.json';
import { SOURCE_MANIFEST } from '../config/sourceManifest';

const STORAGE_KEY = 'FTU_GOGLOBAL_PLANNER_DRAFT_V2';
const STORAGE_VERSION = '3.0.0';
const DATA_VERSION = 'S27-2026-2027';

function checksum(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function isValidProfile(value: unknown): value is StudentProfile {
  if (!value || typeof value !== 'object') return false;
  const profile = value as Partial<StudentProfile>;
  const language = profile.languageCertificate;
  const courses = profile.courses;
  return typeof profile.cohort === 'string'
    && typeof profile.major === 'string'
    && ['', 'Tiêu chuẩn', 'CLC', 'CTTT'].includes(profile.program || '')
    && typeof profile.exchangeSemester === 'string'
    && typeof profile.targetGraduationSemester === 'string'
    && typeof profile.gpa4 === 'number'
    && typeof profile.gpa10 === 'number'
    && typeof profile.completedSemesters === 'number'
    && typeof profile.accumulatedCredits === 'number'
    && (profile.hasParticipatedSemesterExchange === null || typeof profile.hasParticipatedSemesterExchange === 'boolean')
    && (profile.isFinalSemester === null || typeof profile.isFinalSemester === 'boolean')
    && (profile.hasExemplaryStudentAward === null || typeof profile.hasExemplaryStudentAward === 'boolean')
    && (profile.hasPassedMidtermInternship === null || typeof profile.hasPassedMidtermInternship === 'boolean')
    && !!language
    && typeof language === 'object'
    && typeof language.language === 'string'
    && typeof language.testName === 'string'
    && typeof language.score === 'string'
    && typeof language.level === 'string'
    && typeof language.isValid === 'boolean'
    && (language.expiryDate === undefined || typeof language.expiryDate === 'string')
    && typeof profile.monthlyBudgetVnd === 'number'
    && ['DORMITORY', 'RENT', 'ANY'].includes(profile.housingType || '')
    && typeof profile.stayDurationMonths === 'number'
    && Array.isArray(profile.preferredRegions)
    && profile.preferredRegions.every(region => typeof region === 'string')
    && Array.isArray(courses)
    && courses.every(course => !!course
      && typeof course.courseCode === 'string'
      && typeof course.courseName === 'string'
      && typeof course.credits === 'number'
      && typeof course.isMandatory === 'boolean'
      && typeof course.isTaken === 'boolean'
      && typeof course.isPassed === 'boolean')
    && (profile.manualCourseCodes === undefined
      || (Array.isArray(profile.manualCourseCodes) && profile.manualCourseCodes.every(code => typeof code === 'string')))
    && typeof profile.isProfileComplete === 'boolean';
}

function isValidPlan(value: unknown): value is SelectedStudyPlan {
  if (!value || typeof value !== 'object') return false;
  const plan = value as Partial<SelectedStudyPlan>;
  return typeof plan.universityId === 'string'
    && typeof plan.universityName === 'string'
    && Array.isArray(plan.transferredCourses)
    && plan.transferredCourses.every(pair => !!pair
      && typeof pair.ftuCourseCode === 'string'
      && typeof pair.hostCourseCode === 'string'
      && typeof pair.ftuCredits === 'number'
      && typeof pair.equivalenceId === 'string'
      && ['APPROVED', 'PENDING', 'REJECTED', 'UNCERTAIN'].includes(pair.status || ''))
    && (plan.status === undefined || ['VALID', 'DRAFT_NOT_ELIGIBLE', 'NEEDS_VERIFICATION'].includes(plan.status));
}

function isValidPreferredUniversity(value: unknown): value is PreferredUniversity {
  if (!value || typeof value !== 'object') return false;
  const preferred = value as Partial<PreferredUniversity>;
  return typeof preferred.universityId === 'string'
    && typeof preferred.universityName === 'string'
    && typeof preferred.selectedAt === 'string';
}

function isValidPreferredUniversities(value: unknown): value is PreferredUniversities {
  if (!value || typeof value !== 'object') return false;
  const preferences = value as Record<string, unknown>;
  return (preferences.nv1 === undefined || isValidPreferredUniversity(preferences.nv1))
    && (preferences.nv2 === undefined || isValidPreferredUniversity(preferences.nv2))
    && (preferences.nv3 === undefined || isValidPreferredUniversity(preferences.nv3));
}

function derivePreferencesFromPlans(value: unknown): PreferredUniversities {
  if (!isValidRankedChoices(value)) return {};
  const preferences: PreferredUniversities = {};
  (['nv1', 'nv2', 'nv3'] as const).forEach(rank => {
    const plan = value[rank];
    if (plan) {
      preferences[rank] = {
        universityId: plan.universityId,
        universityName: plan.universityName,
        selectedAt: plan.savedAt || new Date(0).toISOString()
      };
    }
  });
  return preferences;
}

function isValidRankedChoices(value: unknown): value is { nv1?: SelectedStudyPlan; nv2?: SelectedStudyPlan; nv3?: SelectedStudyPlan } {
  if (!value || typeof value !== 'object') return false;
  const choices = value as Record<string, unknown>;
  return ['nv1', 'nv2', 'nv3'].every(key => choices[key] === undefined || isValidPlan(choices[key]));
}

function normalizeRankedChoices(value: unknown): { nv1?: SelectedStudyPlan; nv2?: SelectedStudyPlan; nv3?: SelectedStudyPlan } {
  if (!isValidRankedChoices(value)) return {};
  const normalized: { nv1?: SelectedStudyPlan; nv2?: SelectedStudyPlan; nv3?: SelectedStudyPlan } = {};
  (['nv1', 'nv2', 'nv3'] as const).forEach(rank => {
    const plan = value[rank];
    if (plan && (Boolean(plan.status) || Boolean(plan.savedAt) || plan.transferredCourses.length > 0 || Boolean(plan.hostAdditionalCourses?.length))) {
      normalized[rank] = plan;
    }
  });
  return normalized;
}

function hasValidChecksum(value: Record<string, unknown>): boolean {
  if (!value.checksum || typeof value.checksum !== 'string') return true;
  const { checksum: suppliedChecksum, ...payload } = value;
  return checksum(JSON.stringify(payload)) === suppliedChecksum;
}

const defaultProfile: StudentProfile = {
  cohort: '',
  major: '',
  program: '',
  exchangeSemester: 'Học kỳ II năm học 2026 - 2027 (S27)',
  targetGraduationSemester: '',
  gpa4: 0,
  gpa10: 0,
  completedSemesters: 0,
  accumulatedCredits: 0,
  hasParticipatedSemesterExchange: null,
  isFinalSemester: null,
  hasExemplaryStudentAward: null,
  hasPassedMidtermInternship: null,
  languageCertificate: {
    language: '',
    testName: '',
    score: '',
    level: '',
    isValid: false,
    expiryDate: ''
  },
  monthlyBudgetVnd: 0,
  housingType: 'ANY',
  stayDurationMonths: 0,
  preferredRegions: [],
  courses: [],
  manualCourseCodes: [],
  isProfileComplete: false
};

interface StudentContextType {
  profile: StudentProfile;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  selectedUniId: string | null;
  setSelectedUniId: (id: string | null) => void;
  currentPlan: SelectedStudyPlan | null;
  setCurrentPlan: (plan: SelectedStudyPlan | null) => void;
  rankedChoices: {
    nv1?: SelectedStudyPlan;
    nv2?: SelectedStudyPlan;
    nv3?: SelectedStudyPlan;
  };
  preferredUniversities: PreferredUniversities;
  activePreferenceRank: PreferenceRank | null;
  preferenceReplacementRank: PreferenceRank | null;
  setPreferenceReplacementRank: (rank: PreferenceRank | null) => void;
  selectPreferredUniversity: (rank: PreferenceRank, university: PreferredUniversity) => boolean;
  replacePreferredUniversity: (rank: PreferenceRank, university: PreferredUniversity) => boolean;
  removePreferredUniversity: (rank: PreferenceRank) => void;
  reorderPreferredUniversities: (from: PreferenceRank, to: PreferenceRank) => void;
  openPlanForPreference: (rank: PreferenceRank) => boolean;
  clearSavedPlan: (rank: PreferenceRank) => void;
  setRankedChoice: (rank: 'nv1' | 'nv2' | 'nv3', plan: SelectedStudyPlan | undefined) => void;
  updateProfile: (updates: Partial<StudentProfile>) => void;
  updateCourse: (courseCode: string, isPassed: boolean, isTaken: boolean) => void;
  loadSampleProfile: () => void;
  resetAll: () => void;
  saveDraft: () => boolean;
  loadDraft: () => boolean;
  exportDraftJson: () => string;
  importDraftJson: (jsonString: string) => boolean;
  lastSavedAt: string | null;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<StudentProfile>(defaultProfile);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedUniId, setSelectedUniId] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<SelectedStudyPlan | null>(null);
  const [rankedChoices, setRankedChoices] = useState<{
    nv1?: SelectedStudyPlan;
    nv2?: SelectedStudyPlan;
    nv3?: SelectedStudyPlan;
  }>({});
  const [preferredUniversities, setPreferredUniversities] = useState<PreferredUniversities>({});
  const [activePreferenceRank, setActivePreferenceRank] = useState<PreferenceRank | null>(null);
  const [preferenceReplacementRank, setPreferenceReplacementRank] = useState<PreferenceRank | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // Auto load draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('FTU_GOGLOBAL_PLANNER_DRAFT_V1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!hasValidChecksum(parsed)) throw new Error('Draft checksum mismatch');
        if (isValidProfile(parsed.profile)) setProfile(parsed.profile);
        setRankedChoices(normalizeRankedChoices(parsed.rankedChoices));
        const restoredPreferences = isValidPreferredUniversities(parsed.preferredUniversities)
          ? parsed.preferredUniversities
          : derivePreferencesFromPlans(parsed.rankedChoices);
        setPreferredUniversities(restoredPreferences);
        if (isValidPlan(parsed.currentPlan)) setCurrentPlan(parsed.currentPlan);
        if (parsed.currentStep) setCurrentStep(parsed.currentStep);
        if (parsed.selectedUniId) setSelectedUniId(parsed.selectedUniId);
        if (['nv1', 'nv2', 'nv3'].includes(parsed.activePreferenceRank)) setActivePreferenceRank(parsed.activePreferenceRank);
        if (parsed.updatedAt) setLastSavedAt(parsed.updatedAt);
      }
    } catch (e) {
      console.warn('Could not restore draft from localStorage', e);
    }
    setIsHydrated(true);
  }, []);

  // Keep another open planner tab from silently overwriting a newer draft.
  useEffect(() => {
    const handleExternalDraftUpdate = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue);
        if (!hasValidChecksum(parsed) || !isValidProfile(parsed.profile)) return;
        setProfile(parsed.profile);
        setRankedChoices(normalizeRankedChoices(parsed.rankedChoices));
        setPreferredUniversities(isValidPreferredUniversities(parsed.preferredUniversities)
          ? parsed.preferredUniversities
          : derivePreferencesFromPlans(parsed.rankedChoices));
        setCurrentPlan(isValidPlan(parsed.currentPlan) ? parsed.currentPlan : null);
        setCurrentStep(typeof parsed.currentStep === 'number' ? parsed.currentStep : 1);
        setSelectedUniId(typeof parsed.selectedUniId === 'string' ? parsed.selectedUniId : null);
        setActivePreferenceRank(['nv1', 'nv2', 'nv3'].includes(parsed.activePreferenceRank) ? parsed.activePreferenceRank : null);
        setLastSavedAt(typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null);
      } catch (e) {
        console.warn('Could not synchronize draft from another tab', e);
      }
    };
    window.addEventListener('storage', handleExternalDraftUpdate);
    return () => window.removeEventListener('storage', handleExternalDraftUpdate);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const timer = window.setTimeout(() => {
      try {
        const payload = {
          version: STORAGE_VERSION,
          dataVersion: DATA_VERSION,
          updatedAt: new Date().toISOString(),
          profile,
          currentPlan,
          rankedChoices,
          preferredUniversities,
          activePreferenceRank,
          currentStep,
          selectedUniId,
          sourceManifest: SOURCE_MANIFEST
        };
        const serialized = JSON.stringify(payload);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...payload, checksum: checksum(serialized) }));
        setLastSavedAt(payload.updatedAt);
      } catch (e) {
        console.error('Failed to auto-save draft', e);
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [isHydrated, profile, currentPlan, rankedChoices, preferredUniversities, activePreferenceRank, currentStep, selectedUniId]);

  const updateProfile = (updates: Partial<StudentProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
    // Any profile/course change invalidates derived matching and graduation results.
    setCurrentPlan(null);
    setRankedChoices({});
    setPreferredUniversities({});
    setActivePreferenceRank(null);
    setPreferenceReplacementRank(null);
  };

  const updateCourse = (courseCode: string, isPassed: boolean, isTaken: boolean) => {
    setProfile(prev => {
      const updatedCourses = prev.courses.map(c => {
        if (c.courseCode.toUpperCase() === courseCode.toUpperCase()) {
          return { ...c, isPassed, isTaken };
        }
        return c;
      });

      // Recalculate passed credits
      const passedCredits = updatedCourses
        .filter(c => c.isPassed)
        .reduce((sum, c) => sum + c.credits, 0);

      return {
        ...prev,
        courses: updatedCourses,
        accumulatedCredits: passedCredits > 0 ? passedCredits : prev.accumulatedCredits
      };
    });
  };

  const loadSampleProfile = () => {
    const rawCourses = sampleCurriculumData as unknown as StudentCourse[];
    const passedCredits = rawCourses
      .filter(c => c.isPassed)
      .reduce((sum, c) => sum + c.credits, 0);

    setProfile({
      ...defaultProfile,
      courses: rawCourses,
      accumulatedCredits: passedCredits,
      isProfileComplete: true
    });
    setCurrentStep(2);
  };

  const resetAll = () => {
    setProfile(defaultProfile);
    setCurrentStep(1);
    setSelectedUniId(null);
    setCurrentPlan(null);
    setRankedChoices({});
    setPreferredUniversities({});
    setActivePreferenceRank(null);
    setPreferenceReplacementRank(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('FTU_GOGLOBAL_PLANNER_DRAFT_V1');
    }
    setLastSavedAt(null);
  };

  const saveDraft = (): boolean => {
    try {
      const draft = {
        version: STORAGE_VERSION,
        dataVersion: DATA_VERSION,
        updatedAt: new Date().toISOString(),
        profile,
        currentPlan,
        rankedChoices,
        preferredUniversities,
        activePreferenceRank,
        currentStep,
        selectedUniId,
        sourceManifest: SOURCE_MANIFEST
      };
      const serialized = JSON.stringify(draft);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...draft, checksum: checksum(serialized) }));
      setLastSavedAt(draft.updatedAt);
      return true;
    } catch (e) {
      console.error('Failed to save draft', e);
      return false;
    }
  };

  const loadDraft = (): boolean => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('FTU_GOGLOBAL_PLANNER_DRAFT_V1');
      if (!saved) return false;
      const parsed = JSON.parse(saved);
      if (!hasValidChecksum(parsed) || !isValidProfile(parsed.profile)) return false;
      const ranked = parsed.rankedChoices || {};
      if (!isValidRankedChoices(ranked)) return false;
      if (parsed.profile) setProfile(parsed.profile);
      setRankedChoices(normalizeRankedChoices(ranked));
      setPreferredUniversities(isValidPreferredUniversities(parsed.preferredUniversities)
        ? parsed.preferredUniversities
        : derivePreferencesFromPlans(ranked));
      if (isValidPlan(parsed.currentPlan)) setCurrentPlan(parsed.currentPlan);
      if (parsed.currentStep) setCurrentStep(parsed.currentStep);
      if (parsed.selectedUniId) setSelectedUniId(parsed.selectedUniId);
      if (['nv1', 'nv2', 'nv3'].includes(parsed.activePreferenceRank)) setActivePreferenceRank(parsed.activePreferenceRank);
      if (parsed.updatedAt) setLastSavedAt(parsed.updatedAt);
      return true;
    } catch (e) {
      console.error('Failed to load draft', e);
      return false;
    }
  };

  const exportDraftJson = (): string => {
    const draft = {
      version: STORAGE_VERSION,
      dataVersion: DATA_VERSION,
      exportedAt: new Date().toISOString(),
      profile,
      currentPlan,
      rankedChoices,
      preferredUniversities,
      activePreferenceRank,
      sourceManifest: SOURCE_MANIFEST
    };
    const serialized = JSON.stringify(draft);
    return JSON.stringify({ ...draft, checksum: checksum(serialized) }, null, 2);
  };

  const importDraftJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || parsed.version !== STORAGE_VERSION || parsed.dataVersion !== DATA_VERSION) return false;
      if (parsed.checksum) {
        const { checksum: suppliedChecksum, ...payload } = parsed;
        if (checksum(JSON.stringify(payload)) !== suppliedChecksum) return false;
      }
      if (isValidProfile(parsed.profile) && isValidRankedChoices(parsed.rankedChoices)) {
        setProfile(parsed.profile);
        setRankedChoices(normalizeRankedChoices(parsed.rankedChoices));
        setPreferredUniversities(isValidPreferredUniversities(parsed.preferredUniversities)
          ? parsed.preferredUniversities
          : derivePreferencesFromPlans(parsed.rankedChoices));
        if (isValidPlan(parsed.currentPlan)) setCurrentPlan(parsed.currentPlan);
        if (['nv1', 'nv2', 'nv3'].includes(parsed.activePreferenceRank)) setActivePreferenceRank(parsed.activePreferenceRank);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to import draft json', e);
      return false;
    }
  };

  const setRankedChoice = (rank: 'nv1' | 'nv2' | 'nv3', plan: SelectedStudyPlan | undefined) => {
    setRankedChoices(prev => {
      const next = { ...prev };
      if (!plan) {
        delete next[rank];
      } else {
        next[rank] = plan;
      }
      return next;
    });
  };

  const selectPreferredUniversity = (rank: PreferenceRank, university: PreferredUniversity): boolean => {
    const duplicate = Object.entries(preferredUniversities).some(([existingRank, existing]) => (
      existingRank !== rank && existing?.universityId === university.universityId
    ));
    if (duplicate) return false;
    setPreferredUniversities(prev => ({ ...prev, [rank]: university }));
    setPreferenceReplacementRank(null);
    setActivePreferenceRank(rank);
    setSelectedUniId(university.universityId);
    return true;
  };

  const replacePreferredUniversity = (rank: PreferenceRank, university: PreferredUniversity): boolean => {
    const duplicate = Object.entries(preferredUniversities).some(([existingRank, existing]) => (
      existingRank !== rank && existing?.universityId === university.universityId
    ));
    if (duplicate) return false;
    setRankedChoices(prev => {
      const next = { ...prev };
      delete next[rank];
      return next;
    });
    setCurrentPlan(null);
    setPreferredUniversities(prev => ({ ...prev, [rank]: university }));
    setPreferenceReplacementRank(null);
    setActivePreferenceRank(rank);
    setSelectedUniId(university.universityId);
    return true;
  };

  const removePreferredUniversity = (rank: PreferenceRank) => {
    setPreferredUniversities(prev => {
      const next = { ...prev };
      delete next[rank];
      return next;
    });
    setRankedChoices(prev => {
      const next = { ...prev };
      delete next[rank];
      return next;
    });
    if (activePreferenceRank === rank) {
      setActivePreferenceRank(null);
      setSelectedUniId(null);
      setCurrentPlan(null);
      setPreferenceReplacementRank(null);
    }
  };

  const reorderPreferredUniversities = (from: PreferenceRank, to: PreferenceRank) => {
    if (from === to) return;
    setPreferredUniversities(prev => {
      const next = { ...prev };
      const fromValue = next[from];
      const toValue = next[to];
      if (fromValue) next[to] = fromValue; else delete next[to];
      if (toValue) next[from] = toValue; else delete next[from];
      return next;
    });
    setRankedChoices(prev => {
      const next = { ...prev };
      const fromValue = next[from];
      const toValue = next[to];
      if (fromValue) next[to] = fromValue; else delete next[to];
      if (toValue) next[from] = toValue; else delete next[from];
      return next;
    });
    setActivePreferenceRank(prev => prev === from ? to : prev === to ? from : prev);
  };

  const openPlanForPreference = (rank: PreferenceRank): boolean => {
    const preference = preferredUniversities[rank];
    if (!preference) return false;
    setActivePreferenceRank(rank);
    setSelectedUniId(preference.universityId);
    setCurrentPlan(rankedChoices[rank] || null);
    setCurrentStep(4);
    return true;
  };

  const clearSavedPlan = (rank: PreferenceRank) => {
    setRankedChoices(prev => {
      const next = { ...prev };
      delete next[rank];
      return next;
    });
    if (activePreferenceRank === rank) setCurrentPlan(null);
  };

  return (
    <StudentContext.Provider
      value={{
        profile,
        currentStep,
        setCurrentStep,
        selectedUniId,
        setSelectedUniId,
        currentPlan,
        setCurrentPlan,
        rankedChoices,
        preferredUniversities,
        activePreferenceRank,
        preferenceReplacementRank,
        setPreferenceReplacementRank,
        selectPreferredUniversity,
        replacePreferredUniversity,
        removePreferredUniversity,
        reorderPreferredUniversities,
        openPlanForPreference,
        clearSavedPlan,
        setRankedChoice,
        updateProfile,
        updateCourse,
        loadSampleProfile,
        resetAll,
        saveDraft,
        loadDraft,
        exportDraftJson,
        importDraftJson,
        lastSavedAt
      }}
    >
      {children}
    </StudentContext.Provider>
  );
};

export const useStudent = (): StudentContextType => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
};
