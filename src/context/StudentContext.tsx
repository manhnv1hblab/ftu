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

const STORAGE_KEY = 'FTU_GOGLOBAL_PLANNER_DRAFT_V2';
const STORAGE_VERSION = '4.0.0';
const DATA_VERSION = 'S27-2026-2027-course-audit-3-program-mapping';
type SyncStatus = 'LOCAL' | 'SYNCING' | 'SYNCED' | 'OFFLINE' | 'CONFLICT';
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

function hasValidChecksum(value: Record<string, unknown>): boolean {
  if (!value.checksum || typeof value.checksum !== 'string') return true;
  const { checksum: suppliedChecksum, ...payload } = value;
  return checksum(JSON.stringify(payload)) === suppliedChecksum;
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
  resetAll: () => void;
  saveDraft: () => boolean;
  loadDraft: () => boolean;
  exportDraftJson: () => string;
  importDraftJson: (jsonString: string) => boolean;
  lastSavedAt: string | null;
  syncStatus: SyncStatus;
  draftConflict: boolean;
  resolveDraftConflict: (choice: 'DEVICE' | 'ACCOUNT' | 'NEWER') => void;
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
  const [isHydrated, setIsHydrated] = useState(false);
  const currentStep = allowedPlannerStep(requestedStep, profile, selectedUniId);
  // Evaluate navigation after batched profile/selection updates, including manual upload.
  const setCurrentStep = (step: number) => setRequestedStep(step);
  useEffect(() => {
    if (isHydrated && requestedStep !== currentStep) setRequestedStep(currentStep);
  }, [isHydrated, requestedStep, currentStep]);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('LOCAL');
  const [pendingConflict, setPendingConflict] = useState<{ device: DraftPayload; account: DraftPayload } | null>(null);
  const applyingRemote = useRef(false);
  const previousUserId = useRef<string | null>(null);
  const storageKey = user?.id ? `${STORAGE_KEY}:${user.id}` : STORAGE_KEY;

  useEffect(() => {
    if (previousUserId.current && previousUserId.current !== (user?.id || null)) {
      setProfile(defaultProfile);
      setRequestedStep(1);
      setSelectedUniId(null);
      setCurrentPlan(null);
      setRankedChoices({});
      setPreferredUniversities({});
      setActivePreferenceRank(null);
      setPreferenceReplacementRank(null);
      setLastSavedAt(null);
      setSyncStatus('LOCAL');
    }
    previousUserId.current = user?.id || null;
  }, [user?.id]);

  // Load the guest/device draft first. Authenticated drafts use a user-scoped key.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey) || (user?.id ? localStorage.getItem(STORAGE_KEY) : null) || localStorage.getItem('FTU_GOGLOBAL_PLANNER_DRAFT_V1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!hasValidChecksum(parsed)) throw new Error('Draft checksum mismatch');
        const needsRevalidation = parsed.dataVersion !== DATA_VERSION || parsed.version !== STORAGE_VERSION;
        if (isValidProfile(parsed.profile)) setProfile(parsed.profile);
        setRankedChoices(needsRevalidation
          ? markRankedChoicesForRevalidation(parsed.rankedChoices)
          : normalizeRankedChoices(parsed.rankedChoices));
        const restoredPreferences = isValidPreferredUniversities(parsed.preferredUniversities)
          ? parsed.preferredUniversities
          : derivePreferencesFromPlans(parsed.rankedChoices);
        setPreferredUniversities(restoredPreferences);
        if (isValidPlan(parsed.currentPlan)) setCurrentPlan(needsRevalidation
          ? markPlanForRevalidation(parsed.currentPlan) || null
          : parsed.currentPlan);
        if (parsed.currentStep) setRequestedStep(parsed.currentStep);
        if (parsed.selectedUniId) setSelectedUniId(parsed.selectedUniId);
        if (['nv1', 'nv2', 'nv3'].includes(parsed.activePreferenceRank)) setActivePreferenceRank(parsed.activePreferenceRank);
        if (parsed.updatedAt) setLastSavedAt(parsed.updatedAt);
      }
    } catch (e) {
      console.warn('Could not restore draft from localStorage', e);
    }
    setIsHydrated(true);
  }, [storageKey, user?.id]);

  // Keep another open planner tab from silently overwriting a newer draft.
  useEffect(() => {
    const handleExternalDraftUpdate = (event: StorageEvent) => {
      if (event.key !== storageKey && event.key !== STORAGE_KEY) return;
      if (!event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue);
        if (!hasValidChecksum(parsed) || !isValidProfile(parsed.profile)) return;
        setProfile(parsed.profile);
        const needsRevalidation = parsed.dataVersion !== DATA_VERSION || parsed.version !== STORAGE_VERSION;
        setRankedChoices(needsRevalidation
          ? markRankedChoicesForRevalidation(parsed.rankedChoices)
          : normalizeRankedChoices(parsed.rankedChoices));
        setPreferredUniversities(isValidPreferredUniversities(parsed.preferredUniversities)
          ? parsed.preferredUniversities
          : derivePreferencesFromPlans(parsed.rankedChoices));
        setCurrentPlan(isValidPlan(parsed.currentPlan)
          ? (needsRevalidation ? markPlanForRevalidation(parsed.currentPlan) || null : parsed.currentPlan)
          : null);
        setRequestedStep(typeof parsed.currentStep === 'number' ? parsed.currentStep : 1);
        setSelectedUniId(typeof parsed.selectedUniId === 'string' ? parsed.selectedUniId : null);
        setActivePreferenceRank(['nv1', 'nv2', 'nv3'].includes(parsed.activePreferenceRank) ? parsed.activePreferenceRank : null);
        setLastSavedAt(typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null);
      } catch (e) {
        console.warn('Could not synchronize draft from another tab', e);
      }
    };
    window.addEventListener('storage', handleExternalDraftUpdate);
    return () => window.removeEventListener('storage', handleExternalDraftUpdate);
  }, [storageKey]);

  useEffect(() => {
    if (!isHydrated) return;
    const timer = window.setTimeout(() => {
      try {
        const payload: DraftPayload = {
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
        localStorage.setItem(storageKey, JSON.stringify({ ...payload, checksum: checksum(serialized) }));
        setLastSavedAt(payload.updatedAt);
      } catch (e) {
        console.error('Failed to auto-save draft', e);
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [isHydrated, storageKey, profile, currentPlan, rankedChoices, preferredUniversities, activePreferenceRank, currentStep, selectedUniId]);

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

  const applyDraft = (parsed: DraftPayload) => {
    applyingRemote.current = true;
    const needsRevalidation = parsed.dataVersion !== DATA_VERSION || parsed.version !== STORAGE_VERSION;
    setProfile(parsed.profile);
    setRankedChoices(needsRevalidation ? markRankedChoicesForRevalidation(parsed.rankedChoices) : normalizeRankedChoices(parsed.rankedChoices));
    setPreferredUniversities(isValidPreferredUniversities(parsed.preferredUniversities) ? parsed.preferredUniversities : derivePreferencesFromPlans(parsed.rankedChoices));
    setCurrentPlan(isValidPlan(parsed.currentPlan) ? (needsRevalidation ? markPlanForRevalidation(parsed.currentPlan) || null : parsed.currentPlan) : null);
    setRequestedStep(typeof parsed.currentStep === 'number' ? parsed.currentStep : 1);
    setSelectedUniId(typeof parsed.selectedUniId === 'string' ? parsed.selectedUniId : null);
    setActivePreferenceRank(parsed.activePreferenceRank && ['nv1', 'nv2', 'nv3'].includes(parsed.activePreferenceRank) ? parsed.activePreferenceRank : null);
    setLastSavedAt(parsed.updatedAt || null);
    setSyncStatus('SYNCED');
    window.setTimeout(() => { applyingRemote.current = false; }, 0);
  };

  // Supabase is the durable copy for authenticated users. A failed request leaves the local cache usable.
  useEffect(() => {
    if (!isHydrated || !user?.id || applyingRemote.current) return;
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
        setSyncStatus(navigator.onLine ? 'OFFLINE' : 'OFFLINE');
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [draftPayload, isHydrated, user?.id]);

  // Restore the account copy after authentication, asking before overwriting a different device draft.
  useEffect(() => {
    if (!isHydrated || !user?.id) return;
    let cancelled = false;
    const loadAccountDraft = async () => {
      try {
        const response = await fetch('/api/planner/draft', { cache: 'no-store' });
        if (!response.ok) throw new Error('draft load failed');
        const result = await response.json();
        const remote = result?.draft?.draft as DraftPayload | undefined;
        if (cancelled || !remote || !isValidProfile(remote.profile)) return;
        const localRaw = localStorage.getItem(storageKey) || localStorage.getItem(STORAGE_KEY);
        const local = localRaw ? JSON.parse(localRaw) as DraftPayload : null;
        if (local && isValidProfile(local.profile) && JSON.stringify(local) !== JSON.stringify(remote)) {
          setPendingConflict({ device: local, account: remote });
          setSyncStatus('CONFLICT');
          return;
        }
        applyDraft(remote);
      } catch {
        if (!cancelled) setSyncStatus('OFFLINE');
      }
    };
    void loadAccountDraft();
    return () => { cancelled = true; };
  // applyDraft is declared below and intentionally stable for this effect's lifecycle.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, storageKey, user?.id]);

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
      localStorage.removeItem(storageKey);
      if (storageKey !== STORAGE_KEY) localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('FTU_GOGLOBAL_PLANNER_DRAFT_V1');
      if (user?.id) void fetch('/api/planner/draft', { method: 'DELETE' });
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
      localStorage.setItem(storageKey, JSON.stringify({ ...draft, checksum: checksum(serialized) }));
      setLastSavedAt(draft.updatedAt);
      if (user?.id) {
        setSyncStatus('SYNCING');
        void fetch('/api/planner/draft', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ draft, dataVersion: DATA_VERSION }) })
          .then(response => { if (!response.ok) throw new Error('draft sync failed'); setSyncStatus('SYNCED'); })
          .catch(() => setSyncStatus('OFFLINE'));
      }
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
      setRankedChoices(parsed.version !== STORAGE_VERSION || parsed.dataVersion !== DATA_VERSION ? markRankedChoicesForRevalidation(ranked) : normalizeRankedChoices(ranked));
      setPreferredUniversities(isValidPreferredUniversities(parsed.preferredUniversities)
        ? parsed.preferredUniversities
        : derivePreferencesFromPlans(ranked));
      if (isValidPlan(parsed.currentPlan)) setCurrentPlan(parsed.version !== STORAGE_VERSION || parsed.dataVersion !== DATA_VERSION ? markPlanForRevalidation(parsed.currentPlan) || null : parsed.currentPlan);
      if (parsed.currentStep) setRequestedStep(parsed.currentStep);
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

  const resolveDraftConflict = (choice: 'DEVICE' | 'ACCOUNT' | 'NEWER') => {
    if (!pendingConflict) return;
    const chosen = choice === 'ACCOUNT' ? pendingConflict.account
      : choice === 'NEWER' ? (new Date(pendingConflict.account.updatedAt).getTime() > new Date(pendingConflict.device.updatedAt).getTime() ? pendingConflict.account : pendingConflict.device)
      : pendingConflict.device;
    applyDraft(chosen);
    setPendingConflict(null);
    setSyncStatus(choice === 'DEVICE' ? 'SYNCING' : 'SYNCED');
    if (choice === 'DEVICE') {
      void fetch('/api/planner/draft', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ draft: chosen, dataVersion: DATA_VERSION }) }).catch(() => setSyncStatus('OFFLINE'));
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
        resetAll,
        saveDraft,
        loadDraft,
        exportDraftJson,
        importDraftJson,
        lastSavedAt,
        syncStatus,
        draftConflict: Boolean(pendingConflict),
        resolveDraftConflict
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
