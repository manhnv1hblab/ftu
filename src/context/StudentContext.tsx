'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { PROGRAM_TYPES, StudentProfile } from '../types/studentProfile';
import { StudentCourse } from '../types/curriculum';
import { SelectedStudyPlan } from '../types/studyPlan';
import { PreferredUniversities, PreferenceRank, PreferredUniversity } from '../types/preference';
import sampleCurriculumData from '../../data/sample_curriculum.json';
import { isCoursePassed, removeUnavailableTransfers } from '../engine/transferEligibility';
import { normalizeProfile, allowedPlannerStep } from '../lib/profileValidation';
import { SOURCE_MANIFEST } from '../config/sourceManifest';
import { useAuth } from './AuthContext';

const STORAGE_VERSION = '4.0.0';
const DATA_VERSION = 'S27-2026-2027-course-audit-3-program-mapping';
type SyncStatus = 'IDLE' | 'SYNCING' | 'SYNCED' | 'OFFLINE';
type DraftPayload = {
  version: string;
  dataVersion: string;
  updatedAt: string;
  profile: StudentProfile;
  currentPlan: SelectedStudyPlan | null;
  rankedChoices: { nv1?: SelectedStudyPlan; nv2?: SelectedStudyPlan; nv3?: SelectedStudyPlan };
  preferredUniversities: PreferredUniversities;
  activePreferenceRank: PreferenceRank | null;
  currentStep: number;
  selectedUniId: string | null;
  sourceManifest: typeof SOURCE_MANIFEST;
};

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
    && ['majorId', 'programId', 'programName', 'programSourceUrl'].every(key => {
      const value = (profile as Record<string, unknown>)[key];
      return value === undefined || typeof value === 'string';
    })
    && (profile.academicInputs === undefined || (!!profile.academicInputs && typeof profile.academicInputs === 'object'
      && Object.values(profile.academicInputs).every(value => typeof value === 'boolean')))
    && ['', 'Tiêu chuẩn', 'CLC', 'CTTT'].includes(profile.program || '')
    && (profile.programType === undefined || ['', ...PROGRAM_TYPES].includes(profile.programType || ''))
    && (profile.programMappingSource === undefined || ['CATALOGUE', 'NAME_INFERRED', 'DEFAULT_STANDARD'].includes(profile.programMappingSource))
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
    && (language.availability === undefined || ['', 'HAS_CERTIFICATE', 'NO_CERTIFICATE'].includes(language.availability))
    && (language.validity === undefined || ['', 'VALID', 'EXPIRED', 'UNKNOWN'].includes(language.validity))
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
      && typeof course.isPassed === 'boolean'
      && (course.status === undefined || ['PASSED', 'IN_PROGRESS', 'NOT_TAKEN'].includes(course.status)))
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

function markPlanForRevalidation(plan: SelectedStudyPlan | undefined | null): SelectedStudyPlan | undefined {
  if (!plan) return undefined;
  return {
    ...plan,
    status: 'NEEDS_VERIFICATION',
    transferredCourses: plan.transferredCourses.map(pair => ({
      ...pair,
      verificationStatus: 'NEEDS_VERIFICATION',
      verificationReason: 'Bản nháp được tạo bằng hồ sơ hoặc phiên bản dữ liệu cũ; cần đối chiếu lại.'
    })),
    graduationSimulation: undefined
  };
}

function markRankedChoicesForRevalidation(value: unknown): { nv1?: SelectedStudyPlan; nv2?: SelectedStudyPlan; nv3?: SelectedStudyPlan } {
  const choices = normalizeRankedChoices(value);
  return {
    nv1: markPlanForRevalidation(choices.nv1),
    nv2: markPlanForRevalidation(choices.nv2),
    nv3: markPlanForRevalidation(choices.nv3)
  };
}

const defaultProfile: StudentProfile = {
  cohort: '',
  major: '',
  program: '',
  programType: '',
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
  exportDraftJson: () => string;
  importDraftJson: (jsonString: string) => boolean;
  syncStatus: SyncStatus;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [storedProfile, setProfile] = useState<StudentProfile>(defaultProfile);
  const profile = useMemo(() => normalizeProfile(storedProfile), [storedProfile]);
  const [requestedStep, setRequestedStep] = useState<number>(1);
  const [selectedUniId, setSelectedUniId] = useState<string | null>(null);
  const [storedCurrentPlan, setCurrentPlan] = useState<SelectedStudyPlan | null>(null);
  const [storedRankedChoices, setRankedChoices] = useState<{
    nv1?: SelectedStudyPlan;
    nv2?: SelectedStudyPlan;
    nv3?: SelectedStudyPlan;
  }>({});
  // Sanitize every read, including restored/imported drafts and profile changes.
  const currentPlan = useMemo(() => storedCurrentPlan ? removeUnavailableTransfers(storedCurrentPlan, profile.courses) : null, [storedCurrentPlan, profile.courses]);
  const rankedChoices = useMemo(() => Object.fromEntries(Object.entries(storedRankedChoices).map(([rank, plan]) => [
    rank, plan ? removeUnavailableTransfers(plan, profile.courses) : undefined
  ])) as typeof storedRankedChoices, [storedRankedChoices, profile.courses]);
  const [preferredUniversities, setPreferredUniversities] = useState<PreferredUniversities>({});
  const [activePreferenceRank, setActivePreferenceRank] = useState<PreferenceRank | null>(null);
  const [preferenceReplacementRank, setPreferenceReplacementRank] = useState<PreferenceRank | null>(null);
  const [accountReady, setAccountReady] = useState(!user?.id);
  const currentStep = allowedPlannerStep(requestedStep, profile, selectedUniId);
  // Evaluate navigation after batched profile/selection updates, including manual upload.
  const setCurrentStep = (step: number) => setRequestedStep(step);
  useEffect(() => {
    if (accountReady && requestedStep !== currentStep) setRequestedStep(currentStep);
  }, [accountReady, requestedStep, currentStep]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(user?.id ? 'SYNCING' : 'IDLE');
  const skipNextSync = useRef(false);

  const draftPayload = useMemo<DraftPayload>(() => ({
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
  }), [profile, currentPlan, rankedChoices, preferredUniversities, activePreferenceRank, currentStep, selectedUniId]);

  const clearInMemoryDraft = () => {
    setProfile(defaultProfile);
    setRequestedStep(1);
    setSelectedUniId(null);
    setCurrentPlan(null);
    setRankedChoices({});
    setPreferredUniversities({});
    setActivePreferenceRank(null);
    setPreferenceReplacementRank(null);
  };

  const applyDraft = (parsed: DraftPayload) => {
    const needsRevalidation = parsed.dataVersion !== DATA_VERSION || parsed.version !== STORAGE_VERSION;
    setProfile(parsed.profile);
    setRankedChoices(needsRevalidation ? markRankedChoicesForRevalidation(parsed.rankedChoices) : normalizeRankedChoices(parsed.rankedChoices));
    setPreferredUniversities(isValidPreferredUniversities(parsed.preferredUniversities) ? parsed.preferredUniversities : derivePreferencesFromPlans(parsed.rankedChoices));
    setCurrentPlan(isValidPlan(parsed.currentPlan) ? (needsRevalidation ? markPlanForRevalidation(parsed.currentPlan) || null : parsed.currentPlan) : null);
    setRequestedStep(typeof parsed.currentStep === 'number' ? parsed.currentStep : 1);
    setSelectedUniId(typeof parsed.selectedUniId === 'string' ? parsed.selectedUniId : null);
    setActivePreferenceRank(parsed.activePreferenceRank && ['nv1', 'nv2', 'nv3'].includes(parsed.activePreferenceRank) ? parsed.activePreferenceRank : null);
  };

  // The account draft is the only durable source. Guest state is intentionally memory-only.
  useEffect(() => {
    if (!user?.id || !accountReady) return;
    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }
    const timer = window.setTimeout(async () => {
      setSyncStatus('SYNCING');
      try {
        const response = await fetch('/api/planner/draft', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draft: draftPayload, dataVersion: DATA_VERSION })
        });
        if (!response.ok) throw new Error('draft sync failed');
        setSyncStatus('SYNCED');
      } catch {
        setSyncStatus('OFFLINE');
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [accountReady, draftPayload, user?.id]);

  // Restore the account copy after authentication. The account always wins over guest state.
  useEffect(() => {
    let cancelled = false;
    skipNextSync.current = true;
    if (!user?.id) {
      clearInMemoryDraft();
      setAccountReady(true);
      setSyncStatus('IDLE');
      return () => { cancelled = true; };
    }

    setAccountReady(false);
    setSyncStatus('SYNCING');
    const loadAccountDraft = async () => {
      try {
        const response = await fetch('/api/planner/draft', { cache: 'no-store' });
        if (!response.ok) throw new Error('draft load failed');
        const result = await response.json();
        const remote = result?.draft?.draft as DraftPayload | undefined;
        if (cancelled) return;
        if (remote && isValidProfile(remote.profile)) applyDraft(remote);
        else clearInMemoryDraft();
        setAccountReady(true);
        setSyncStatus(remote ? 'SYNCED' : 'IDLE');
      } catch {
        if (!cancelled) {
          setAccountReady(false);
          setSyncStatus('OFFLINE');
        }
      }
    };
    void loadAccountDraft();
    const retryWhenOnline = () => { if (navigator.onLine) void loadAccountDraft(); };
    window.addEventListener('online', retryWhenOnline);
    return () => {
      cancelled = true;
      window.removeEventListener('online', retryWhenOnline);
    };
  }, [user?.id]);

  const updateProfile = (updates: Partial<StudentProfile>) => {
    setProfile(prev => normalizeProfile({ ...normalizeProfile(prev), ...updates }));
    // Keep the user's shortlist and draft, but never present derived results as current.
    setCurrentPlan(prev => markPlanForRevalidation(prev) || null);
    setRankedChoices(prev => Object.fromEntries(Object.entries(prev).map(([rank, plan]) => [rank, markPlanForRevalidation(plan)])) as typeof rankedChoices);
  };

  const updateCourse = (courseCode: string, isPassed: boolean, isTaken: boolean) => {
    setProfile(prev => {
      const updatedCourses = prev.courses.map(c => {
        if (c.courseCode.toUpperCase() === courseCode.toUpperCase()) {
          const status: StudentCourse['status'] = isPassed ? 'PASSED' : isTaken ? 'IN_PROGRESS' : 'NOT_TAKEN';
          return { ...c, isPassed, isTaken, status };
        }
        return c;
      });

      // Recalculate passed credits
      const passedCredits = updatedCourses
        .filter(isCoursePassed)
        .reduce((sum, c) => sum + c.credits, 0);

      return {
        ...prev,
        courses: updatedCourses,
        accumulatedCredits: passedCredits
      };
    });
    setCurrentPlan(prev => markPlanForRevalidation(prev) || null);
    setRankedChoices(prev => Object.fromEntries(Object.entries(prev).map(([rank, plan]) => [
      rank, markPlanForRevalidation(plan)
    ])) as typeof rankedChoices);
  };

  const loadSampleProfile = () => {
    const rawCourses = sampleCurriculumData as unknown as StudentCourse[];
    const passedCredits = rawCourses
      .filter(isCoursePassed)
      .reduce((sum, c) => sum + c.credits, 0);

    setProfile({
      ...defaultProfile,
      courses: rawCourses,
      accumulatedCredits: passedCredits,
      isProfileComplete: false
    });
    setRequestedStep(2);
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
      if (!parsed || ![STORAGE_VERSION, '3.0.0'].includes(parsed.version) || typeof parsed.dataVersion !== 'string') return false;
      if (parsed.checksum) {
        const { checksum: suppliedChecksum, ...payload } = parsed;
        if (checksum(JSON.stringify(payload)) !== suppliedChecksum) return false;
      }
      if (isValidProfile(parsed.profile) && isValidRankedChoices(parsed.rankedChoices)) {
        setProfile(parsed.profile);
        const needsRevalidation = parsed.dataVersion !== DATA_VERSION || parsed.version !== STORAGE_VERSION;
        setRankedChoices(needsRevalidation
          ? markRankedChoicesForRevalidation(parsed.rankedChoices)
          : normalizeRankedChoices(parsed.rankedChoices));
        setPreferredUniversities(isValidPreferredUniversities(parsed.preferredUniversities)
          ? parsed.preferredUniversities
          : derivePreferencesFromPlans(parsed.rankedChoices));
        if (isValidPlan(parsed.currentPlan)) setCurrentPlan(needsRevalidation
          ? markPlanForRevalidation(parsed.currentPlan) || null
          : parsed.currentPlan);
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
    const savedPlan = rankedChoices[rank];
    setActivePreferenceRank(rank);
    setSelectedUniId(preference.universityId);
    setCurrentPlan(savedPlan?.universityId === preference.universityId ? savedPlan : null);
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
        exportDraftJson,
        importDraftJson,
        syncStatus
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
