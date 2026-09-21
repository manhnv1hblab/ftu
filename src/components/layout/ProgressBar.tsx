'use client';

import React from 'react';
import { useStudent } from '../../context/StudentContext';

export const ProgressBar: React.FC = () => {
  const { currentStep, setCurrentStep, selectedUniId } = useStudent();

  const steps = [
    { num: 1, title: 'Tải bảng điểm / CTĐT', subtitle: 'File .xlsx / Mã môn' },
    { num: 2, title: 'Rà soát hồ sơ', subtitle: 'Tình trạng tích lũy' },
    { num: 3, title: 'Gợi ý trường', subtitle: 'Khớp môn ≥ 3' },
    { num: 4, title: 'Lập phương án', subtitle: '5 môn đối tác / 3 FTU' },
    { num: 5, title: 'So sánh & Xuất', subtitle: 'NV1 - NV3 / In A4' },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-space-lg pt-space-md">
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-space-md md:p-space-lg border border-surface-container">
        <div className="flex items-center justify-between gap-space-xs overflow-x-auto pb-space-xs scrollbar-none">
          {steps.map((s, idx) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;

            return (
              <React.Fragment key={s.num}>
                {/* Step Item */}
                <button
                  onClick={() => (s.num !== 4 || selectedUniId) && setCurrentStep(s.num)}
                  disabled={s.num === 4 && !selectedUniId}
                  aria-disabled={s.num === 4 && !selectedUniId}
                  title={s.num === 4 && !selectedUniId ? 'Hãy chọn một trường trước khi lập phương án.' : undefined}
                  className={`flex items-center gap-space-xs shrink-0 text-left group focus:outline-none transition-all ${s.num === 4 && !selectedUniId ? 'opacity-45 cursor-not-allowed' : ''}`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-label-md text-label-md shrink-0 transition-all ${
                      isCompleted
                        ? 'bg-tertiary text-on-tertiary shadow-sm'
                        : isCurrent
                        ? 'bg-primary text-on-primary font-bold shadow-md ring-4 ring-primary-fixed'
                        : 'bg-surface-container-high text-on-surface-variant group-hover:bg-surface-container-highest'
                    }`}
                  >
                    {isCompleted ? (
                      <span className="material-symbols-outlined text-base">check</span>
                    ) : (
                      <span>{s.num}</span>
                    )}
                  </div>

                  <div className="flex flex-col ml-1">
                    <span
                      className={`font-label-md text-label-md leading-tight ${
                        isCurrent
                          ? 'text-primary font-bold'
                          : isCompleted
                          ? 'text-on-surface font-semibold'
                          : 'text-on-surface-variant font-medium'
                      }`}
                    >
                      {s.title}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                      {s.subtitle}
                    </span>
                  </div>
                </button>

                {/* Arrow Divider */}
                {idx < steps.length - 1 && (
                  <span className="material-symbols-outlined text-on-surface-variant/40 shrink-0 text-base hidden sm:inline-block">
                    chevron_right
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
