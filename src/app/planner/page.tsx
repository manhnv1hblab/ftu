'use client';

import React from 'react';
import { useStudent } from '../../context/StudentContext';
import { ProgressBar } from '../../components/layout/ProgressBar';
import { Step1Upload } from '../../components/planner/Step1Upload';
import { Step2Review } from '../../components/planner/Step2Review';
import { Step3Matches } from '../../components/planner/Step3Matches';
import { Step4CoursePlan } from '../../components/planner/Step4CoursePlan';
import { Step5Compare } from '../../components/planner/Step5Compare';

export default function PlannerPage() {
  const { currentStep } = useStudent();

  return (
    <div className="space-y-8 pb-16">
      {/* Top Stepper Tracker */}
      <ProgressBar />

      {/* Dynamic Step View */}
      <div className="px-4 sm:px-6 lg:px-8">
        {currentStep === 1 && <Step1Upload />}
        {currentStep === 2 && <Step2Review />}
        {currentStep === 3 && <Step3Matches />}
        {currentStep === 4 && <Step4CoursePlan />}
        {currentStep === 5 && <Step5Compare />}
      </div>
    </div>
  );
}
