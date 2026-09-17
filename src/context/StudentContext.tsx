'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { StudentProfile } from '../types/studentProfile';
import { StudentCourse } from '../types/curriculum';
import { SelectedStudyPlan } from '../types/studyPlan';
import sampleCurriculumData from '../../data/sample_curriculum.json';

const STORAGE_KEY = 'FTU_GOGLOBAL_PLANNER_DRAFT_V1';

const defaultProfile: StudentProfile = {
  cohort: 'K62',
  major: 'Kinh tế đối ngoại',
  program: 'Tiêu chuẩn',
  exchangeSemester: 'Học kỳ II năm học 2026 - 2027 (S27)',
  targetGraduationSemester: 'Học kỳ 2 - Năm học 2027-2028',
  gpa4: 3.25,
  gpa10: 8.12,
  completedSemesters: 3,
  accumulatedCredits: 48,
  hasParticipatedSemesterExchange: false,
  isFinalSemester: false,
  hasExemplaryStudentAward: false,
  hasPassedMidtermInternship: true,
  languageCertificate: {
    language: 'English',
    testName: 'IELTS Academic',
    score: '6.5',
    level: 'B2',
    isValid: true,
    expiryDate: '2027-10-15'
  },
  monthlyBudgetVnd: 20000000,
  housingType: 'ANY',
  stayDurationMonths: 5,
  preferredRegions: ['Asia', 'Europe'],
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
  setRankedChoice: (rank: 'nv1' | 'nv2' | 'nv3', plan: SelectedStudyPlan | undefined) => void;
  updateProfile: (updates: Partial<StudentProfile>) => void;
  updateCourse: (courseCode: string, isPassed: boolean, isTaken: boolean) => void;
  loadSampleProfile: () => void;
  resetAll: () => void;
  saveDraft: () => boolean;
  loadDraft: () => boolean;
  exportDraftJson: () => string;
  importDraftJson: (jsonString: string) => boolean;
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

  // Auto load draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.profile) setProfile(parsed.profile);
        if (parsed.rankedChoices) setRankedChoices(parsed.rankedChoices);
        if (parsed.currentStep) setCurrentStep(parsed.currentStep);
        if (parsed.selectedUniId) setSelectedUniId(parsed.selectedUniId);
      }
    } catch (e) {
      console.warn('Could not restore draft from localStorage', e);
    }
  }, []);

  const updateProfile = (updates: Partial<StudentProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
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
    localStorage.removeItem(STORAGE_KEY);
  };

  const saveDraft = (): boolean => {
    try {
      const draft = {
        version: '1.0.0',
        dataVersion: 'S27-2026-2027',
        updatedAt: new Date().toISOString(),
        profile,
        rankedChoices,
        currentStep,
        selectedUniId
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      return true;
    } catch (e) {
      console.error('Failed to save draft', e);
      return false;
    }
  };

  const loadDraft = (): boolean => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return false;
      const parsed = JSON.parse(saved);
      if (parsed.profile) setProfile(parsed.profile);
      if (parsed.rankedChoices) setRankedChoices(parsed.rankedChoices);
      if (parsed.currentStep) setCurrentStep(parsed.currentStep);
      if (parsed.selectedUniId) setSelectedUniId(parsed.selectedUniId);
      return true;
    } catch (e) {
      console.error('Failed to load draft', e);
      return false;
    }
  };

  const exportDraftJson = (): string => {
    const draft = {
      version: '1.0.0',
      dataVersion: 'S27-2026-2027',
      exportedAt: new Date().toISOString(),
      profile,
      rankedChoices
    };
    return JSON.stringify(draft, null, 2);
  };

  const importDraftJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.profile) {
        setProfile(parsed.profile);
        if (parsed.rankedChoices) setRankedChoices(parsed.rankedChoices);
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
        setRankedChoice,
        updateProfile,
        updateCourse,
        loadSampleProfile,
        resetAll,
        saveDraft,
        loadDraft,
        exportDraftJson,
        importDraftJson
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
