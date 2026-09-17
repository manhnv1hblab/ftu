'use client';

import React, { useState, useMemo } from 'react';
import { useStudent } from '../../context/StudentContext';
import { checkProgramEligibility } from '../../engine/eligibility';
import { calculateElectiveGroups } from '../../engine/electives';
import { StudentCourse } from '../../types/curriculum';

export const Step2Review: React.FC = () => {
  const { profile, updateProfile, setCurrentStep } = useStudent();

  const [activeTab, setActiveTab] = useState<'REMAINING' | 'ENROLLED' | 'PASSED'>('REMAINING');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showEligibilityDetails, setShowEligibilityDetails] = useState(false);

  // New course state
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCredits, setNewCredits] = useState(3);
  const [newBlock, setNewBlock] = useState('Chuyên ngành bắt buộc');

  // S27 Eligibility Evaluation
  const eligibility = useMemo(() => {
    return checkProgramEligibility(profile);
  }, [profile]);

  // Elective groups breakdown
  const electiveGroups = useMemo(() => {
    return calculateElectiveGroups(profile.courses);
  }, [profile.courses]);

  // Categorize courses
  const passedCourses = useMemo(() => profile.courses.filter(c => c.isPassed), [profile.courses]);
  const enrolledCourses = useMemo(() => profile.courses.filter(c => c.isTaken && !c.isPassed), [profile.courses]);
  const remainingCourses = useMemo(() => profile.courses.filter(c => !c.isPassed && !c.isTaken), [profile.courses]);

  const passedCredits = passedCourses.reduce((sum, c) => sum + c.credits, 0);
  const enrolledCredits = enrolledCourses.reduce((sum, c) => sum + c.credits, 0);
  const remainingCredits = remainingCourses.reduce((sum, c) => sum + c.credits, 0);
  const totalStandardCredits = 132;
  const completedPercent = Math.min(100, Math.round((passedCredits / totalStandardCredits) * 100));

  // Determine active course list
  const currentList = useMemo(() => {
    if (activeTab === 'PASSED') return passedCourses;
    if (activeTab === 'ENROLLED') return enrolledCourses;
    return remainingCourses;
  }, [activeTab, passedCourses, enrolledCourses, remainingCourses]);

  // Filter list by search query
  const displayedCourses = useMemo(() => {
    if (!searchQuery.trim()) return currentList;
    const q = searchQuery.toLowerCase();
    return currentList.filter(
      c => c.courseCode.toLowerCase().includes(q) || c.courseName.toLowerCase().includes(q)
    );
  }, [currentList, searchQuery]);

  // Status Change Handler
  const handleStatusChange = (courseCode: string, newStatus: 'PASSED' | 'ENROLLED' | 'REMAINING') => {
    const updated = profile.courses.map(c => {
      if (c.courseCode !== courseCode) return c;
      if (newStatus === 'PASSED') {
        return { ...c, isPassed: true, isTaken: true };
      } else if (newStatus === 'ENROLLED') {
        return { ...c, isPassed: false, isTaken: true };
      } else {
        return { ...c, isPassed: false, isTaken: false };
      }
    });

    const newPassedCr = updated.filter(c => c.isPassed).reduce((sum, c) => sum + c.credits, 0);
    updateProfile({
      courses: updated,
      accumulatedCredits: newPassedCr
    });
  };

  // Remove Course Handler
  const handleRemoveCourse = (courseCode: string) => {
    const updated = profile.courses.filter(c => c.courseCode !== courseCode);
    const newPassedCr = updated.filter(c => c.isPassed).reduce((sum, c) => sum + c.credits, 0);
    updateProfile({
      courses: updated,
      accumulatedCredits: newPassedCr
    });
  };

  // Add Course Submit
  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) return;

    const newCourse: StudentCourse = {
      courseCode: newCode.trim().toUpperCase(),
      courseName: newName.trim(),
      credits: newCredits,
      isMandatory: true,
      isTaken: false,
      isPassed: false,
      electiveGroup: newBlock
    };

    updateProfile({
      courses: [...profile.courses, newCourse]
    });

    setNewCode('');
    setNewName('');
    setShowAddCourseModal(false);
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 animate-fade-in py-2">
      {/* 1. Clean Student Profile & Progress Summary */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-7 shadow-sm border border-surface-container/80 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-sm shrink-0 border-2 border-primary/20 bg-primary-fixed/30 group-hover:scale-105 transition-transform">
              <img
                src="/images/3d_graduation.jpg"
                alt="3D Graduation Cap"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-on-surface">Lê Mai Anh</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  {profile.cohort || 'K62'} • {profile.program}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                MSSV: <strong className="text-on-surface">2211110382</strong> • Cơ sở Hà Nội • ĐHKT & KDQT
              </p>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-surface-container-low px-3.5 py-1.5 rounded-2xl border border-surface-container flex items-center gap-2">
              <span className="text-xs text-on-surface-variant">GPA:</span>
              <span className="text-sm font-black text-primary">{profile.gpa4.toFixed(2)}/4.0</span>
            </div>

            <div className="bg-surface-container-low px-3.5 py-1.5 rounded-2xl border border-surface-container flex items-center gap-2">
              <span className="text-xs text-on-surface-variant">Ngoại ngữ:</span>
              <span className="text-sm font-bold text-secondary">IELTS {profile.languageCertificate?.score || '7.5'}</span>
            </div>

            <button
              type="button"
              onClick={() => setShowEligibilityDetails(prev => !prev)}
              className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-colors border ${
                eligibility.isEligible
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {eligibility.isEligible ? 'verified' : 'help'}
              </span>
              <span>{eligibility.isEligible ? 'Đủ chuẩn S27' : 'Chi tiết điều kiện'}</span>
            </button>
          </div>
        </div>

        {/* Progress Bar Strip */}
        <div className="pt-4 border-t border-surface-container flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-on-surface">
              Tiến độ tích lũy: <strong>{passedCredits} / {totalStandardCredits} tín chỉ</strong> ({completedPercent}%)
            </span>
            <div className="flex items-center gap-3 text-xs text-on-surface-variant">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                Đã đạt: {passedCredits} TC
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                Đang học: {enrolledCredits} TC
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
                Cần đổi: {remainingCredits} TC
              </span>
            </div>
          </div>

          <div className="w-full bg-surface-container rounded-full h-2.5 overflow-hidden flex">
            <div
              className="bg-emerald-600 h-full transition-all"
              style={{ width: `${(passedCredits / totalStandardCredits) * 100}%` }}
              title={`Đã tích lũy: ${passedCredits} TC`}
            />
            <div
              className="bg-amber-400 h-full transition-all"
              style={{ width: `${(enrolledCredits / totalStandardCredits) * 100}%` }}
              title={`Đang học: ${enrolledCredits} TC`}
            />
          </div>
        </div>

        {/* Eligibility Details Popover / Drawer */}
        {showEligibilityDetails && (
          <div className="bg-surface-container-low/70 rounded-2xl p-4 mt-2 border border-surface-container text-xs space-y-3 animate-fade-in">
            <div className="flex items-center justify-between font-bold text-on-surface">
              <span>Đánh giá 4 tiêu chí trao đổi S27 (Quy chế FTU)</span>
              <span className={eligibility.isEligible ? 'text-emerald-700' : 'text-amber-700'}>
                {eligibility.isEligible ? '✓ Hồ sơ hợp lệ 100%' : 'Cần lưu ý tiêu chí'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {eligibility.criteria.map((crit) => (
                <div key={crit.code} className="flex items-center gap-2 p-2 bg-white rounded-xl border border-surface-container/60">
                  <span className={`material-symbols-outlined text-base ${crit.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {crit.passed ? 'check_circle' : 'cancel'}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-semibold text-on-surface">{crit.title}</span>
                    <span className="text-[11px] text-on-surface-variant">
                      Hiện tại: <strong>{crit.currentValue}</strong> (Yêu cầu: {crit.requiredValue})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Course Table Segmented Controls & Actions */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-7 shadow-sm border border-surface-container/80 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* 3 Clean Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-surface-container-high rounded-full overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('REMAINING')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'REMAINING'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Môn cần quy đổi ({remainingCourses.length} môn • {remainingCredits} TC)
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ENROLLED')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'ENROLLED'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Đang học ({enrolledCourses.length} môn)
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('PASSED')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'PASSED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Đã tích lũy ({passedCourses.length} môn)
            </button>
          </div>

          {/* Search & Add Course Button */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã hoặc tên môn..."
                className="w-48 sm:w-56 pl-8 pr-3 py-1.5 rounded-full bg-surface-container-low text-xs border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowAddCourseModal(true)}
              className="px-3.5 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all flex items-center gap-1 shrink-0"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>Thêm môn</span>
            </button>
          </div>
        </div>

        {/* Course List Table */}
        <div className="overflow-x-auto rounded-2xl border border-surface-container">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-bold uppercase tracking-wider border-b border-surface-container">
                <th className="py-3 px-4 w-28">Mã môn</th>
                <th className="py-3 px-4">Tên học phần FTU</th>
                <th className="py-3 px-4 w-20 text-center">Số TC</th>
                <th className="py-3 px-4 hidden sm:table-cell">Khối kiến thức</th>
                <th className="py-3 px-4 w-36 text-center">Trạng thái</th>
                <th className="py-3 px-4 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {displayedCourses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-on-surface-variant">
                    Không có học phần nào trong danh mục này.
                  </td>
                </tr>
              ) : (
                displayedCourses.map((c) => (
                  <tr key={c.courseCode} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary">
                      {c.courseCode}
                    </td>
                    <td className="py-3 px-4 font-semibold text-on-surface">
                      {c.courseName}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-on-surface-variant">
                      {c.credits} TC
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell text-on-surface-variant">
                      <span className="px-2 py-0.5 rounded-full bg-surface-container text-[11px]">
                        {c.electiveGroup || (c.isMandatory ? 'Bắt buộc' : 'Tự chọn')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <select
                        value={c.isPassed ? 'PASSED' : c.isTaken ? 'ENROLLED' : 'REMAINING'}
                        onChange={(e) => handleStatusChange(c.courseCode, e.target.value as any)}
                        className={`text-xs font-semibold py-1 px-2.5 rounded-full border cursor-pointer focus:outline-none ${
                          c.isPassed
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : c.isTaken
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-primary/10 text-primary border-primary/20'
                        }`}
                      >
                        <option value="REMAINING">Cần quy đổi</option>
                        <option value="ENROLLED">Đang học</option>
                        <option value="PASSED">Đã tích lũy</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveCourse(c.courseCode)}
                        className="text-on-surface-variant/60 hover:text-rose-600 transition-colors"
                        title="Xóa môn"
                      >
                        <span className="material-symbols-outlined text-base">close</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Navigation Bar */}
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-surface-container">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className="text-xs text-on-surface-variant hover:text-on-surface font-semibold flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Quay lại Bước 1</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className="w-full sm:w-auto px-7 py-3 rounded-full bg-primary text-on-primary text-sm font-bold shadow-md hover:bg-primary-container transition-all flex items-center justify-center gap-2"
          >
            <span>Tiếp tục: Tìm trường đối tác (116 trường)</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Add Course Modal */}
      {showAddCourseModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl border border-surface-container animate-scale-in space-y-4">
            <div className="flex items-center justify-between border-b border-surface-container pb-3">
              <h3 className="text-base font-bold text-on-surface">Thêm môn học FTU mới</h3>
              <button
                type="button"
                onClick={() => setShowAddCourseModal(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleAddCourse} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-on-surface">Mã học phần:</label>
                <input
                  type="text"
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="VD: KTE412"
                  className="w-full p-2.5 rounded-xl border border-surface-container font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-on-surface">Tên học phần:</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="VD: Đầu tư Quốc tế"
                  className="w-full p-2.5 rounded-xl border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Số tín chỉ:</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newCredits}
                    onChange={(e) => setNewCredits(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Khối kiến thức:</label>
                  <select
                    value={newBlock}
                    onChange={(e) => setNewBlock(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Chuyên ngành bắt buộc">Bắt buộc</option>
                    <option value="Tự chọn chuyên sâu 1">Tự chọn 1</option>
                    <option value="Tự chọn chuyên sâu 2">Tự chọn 2</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setShowAddCourseModal(false)}
                  className="px-4 py-2 rounded-full text-on-surface-variant hover:bg-surface-container font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-primary text-on-primary font-bold hover:bg-primary-container shadow-xs"
                >
                  Thêm học phần
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
