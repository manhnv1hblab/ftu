'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useStudent } from '../../context/StudentContext';
import { StudentCourse } from '../../types/curriculum';

export const Step1Upload: React.FC = () => {
  const { profile, updateProfile, setCurrentStep, loadSampleProfile } = useStudent();
  const [activeTab, setActiveTab] = useState<'EXCEL' | 'MANUAL'>('EXCEL');
  const [manualText, setManualText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];

        const rawData = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
        if (rawData.length < 2) {
          throw new Error('File không có đủ dữ liệu.');
        }

        let headerRowIndex = -1;
        let colCode = -1;
        let colName = -1;
        let colCredits = -1;
        let colMandatory = -1;
        let colTaken = -1;
        let colPassed = -1;
        let colGroup = -1;
        let colBranch = -1;
        let colMinCr = -1;
        let colMaxCr = -1;

        for (let r = 0; r < Math.min(rawData.length, 5); r++) {
          const row = rawData[r];
          if (!row) continue;
          row.forEach((cell: any, c: number) => {
            const str = String(cell || '').toLowerCase().trim();
            if (str === 'mã mh' || str === 'mã học phần' || str.includes('mã môn')) colCode = c;
            if (str === 'tên môn học' || str === 'tên học phần') colName = c;
            if (str === 'số tín chỉ' || str === 'số tc') colCredits = c;
            if (str.includes('bắt buộc')) colMandatory = c;
            if (str === 'đã học') colTaken = c;
            if (str.includes('đã học và đạt') || str.includes('đã đạt')) colPassed = c;
            if (str === 'nhóm') colGroup = c;
            if (str === 'nhánh') colBranch = c;
            if (str.includes('tối thiểu')) colMinCr = c;
            if (str.includes('tối đa')) colMaxCr = c;
          });

          if (colCode !== -1) {
            headerRowIndex = r;
            break;
          }
        }

        if (headerRowIndex === -1 || colCode === -1) {
          throw new Error('Không tìm thấy cột "Mã MH" hoặc "Tên môn học". Vui lòng kiểm tra lại cấu trúc file CTĐT.');
        }

        const parsedCourses: StudentCourse[] = [];
        let currentSemester = '';

        for (let r = headerRowIndex + 1; r < rawData.length; r++) {
          const row = rawData[r];
          if (!row || !row.length) continue;

          const firstCell = String(row[0] || '').trim();
          const codeVal = colCode !== -1 && row[colCode] ? String(row[colCode]).trim() : '';

          if (firstCell.toLowerCase().includes('học kỳ') || firstCell.toLowerCase().includes('năm học')) {
            currentSemester = firstCell;
            continue;
          }
          if (firstCell.toLowerCase().includes('tổng') || !codeVal) {
            continue;
          }

          if (colName === -1 || !row[colName] || !String(row[colName]).trim()) {
            throw new Error(`Thiếu tên học phần tại dòng ${r + 1}. Không được tự suy đoán dữ liệu môn học.`);
          }
          if (colCredits === -1 || row[colCredits] === undefined || row[colCredits] === null || row[colCredits] === '') {
            throw new Error(`Thiếu số tín chỉ tại dòng ${r + 1}. Không được tự gán số tín chỉ mặc định.`);
          }
          const nameVal = String(row[colName]).trim();
          const crVal = parseFloat(String(row[colCredits]).replace(',', '.'));
          if (!Number.isFinite(crVal) || crVal <= 0) {
            throw new Error(`Số tín chỉ không hợp lệ tại dòng ${r + 1}.`);
          }
          const isMand = colMandatory !== -1 && row[colMandatory] ? String(row[colMandatory]).trim().toLowerCase() === 'x' : false;
          const isTak = colTaken !== -1 && row[colTaken] ? String(row[colTaken]).trim().toLowerCase() === 'x' : false;
          const isPass = colPassed !== -1 && row[colPassed] ? String(row[colPassed]).trim().toLowerCase() === 'x' : false;

          const grpVal = colGroup !== -1 && row[colGroup] ? String(row[colGroup]).trim() : undefined;
          const brVal = colBranch !== -1 && row[colBranch] ? String(row[colBranch]).trim() : undefined;
          const minCr = colMinCr !== -1 && row[colMinCr] ? parseFloat(String(row[colMinCr])) || 0 : 0;
          const maxCr = colMaxCr !== -1 && row[colMaxCr] ? parseFloat(String(row[colMaxCr])) || 0 : 0;

          parsedCourses.push({
            courseCode: codeVal.toUpperCase(),
            courseName: nameVal,
            credits: crVal,
            isMandatory: isMand,
            isTaken: isTak,
            isPassed: isPass,
            electiveGroup: grpVal,
            electiveBranch: brVal,
            minCredits: minCr,
            maxCredits: maxCr,
            suggestedSemester: currentSemester
            ,dataStatus: 'VERIFIED'
          });
        }

        if (parsedCourses.length === 0) {
          throw new Error('File không chứa danh sách môn học hợp lệ.');
        }

        const duplicateCodes = parsedCourses
          .map(course => course.courseCode)
          .filter((code, index, allCodes) => allCodes.indexOf(code) !== index);
        if (duplicateCodes.length > 0) {
          const uniqueDuplicateCodes = Array.from(new Set(duplicateCodes));
          throw new Error(`Trùng mã học phần: ${uniqueDuplicateCodes.join(', ')}. Vui lòng kiểm tra lại file trước khi import.`);
        }

        const passedCredits = parsedCourses
          .filter(c => c.isPassed)
          .reduce((sum, c) => sum + c.credits, 0);

        updateProfile({
          courses: parsedCourses,
          accumulatedCredits: passedCredits > 0 ? passedCredits : profile.accumulatedCredits,
          isProfileComplete: true
        });

        setAttachedFileName(file.name);
        setIsProcessing(false);
      } catch (err: any) {
        setIsProcessing(false);
        setErrorMessage(err.message || 'Lỗi đọc file Excel. Vui lòng thử lại.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Manual Input Handler
  const handleManualSubmit = () => {
    if (!manualText.trim()) {
      setErrorMessage('Vui lòng nhập ít nhất một mã môn học.');
      return;
    }

    const rawCodes = manualText.split(/[\s,;\n]+/);
    const cleanCodes = Array.from(
      new Set(
        rawCodes
          .map(c => c.trim().toUpperCase())
          .filter(c => c.length >= 2 && /^[A-Z0-9]+$/.test(c))
      )
    );

    if (cleanCodes.length === 0) {
      setErrorMessage('Không nhận diện được mã môn học hợp lệ (VD: KTE402, TIN314, PLU422).');
      return;
    }

    const manualCourses: StudentCourse[] = cleanCodes.map(code => ({
      courseCode: code,
      courseName: '',
      credits: 0,
      isMandatory: true,
      isTaken: false,
      isPassed: false,
      dataStatus: 'NEEDS_VERIFICATION'
    }));

    updateProfile({
      courses: manualCourses,
      manualCourseCodes: cleanCodes,
      isProfileComplete: true
    });

    setCurrentStep(2);
  };

  const handleUseSample = () => {
    loadSampleProfile();
    setAttachedFileName('Hồ sơ mẫu (demo từ dữ liệu CTĐT)');
  };

  const courseCount = profile.courses.length;
  const passedCredits = profile.courses.filter(c => c.isPassed).reduce((sum, c) => sum + c.credits, 0);
  const remainingCredits = profile.courses.filter(c => !c.isPassed).reduce((sum, c) => sum + c.credits, 0);

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 animate-fade-in py-4">
      {/* Header Section */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-label-sm text-xs font-bold">
          <span className="material-symbols-outlined text-sm">school</span>
          <span>Học kỳ II Năm học 2026 - 2027 (Kỳ S27)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
          Cung cấp Bảng điểm / Chương trình Đào tạo FTU
        </h1>
        <p className="text-sm text-on-surface-variant max-w-xl mx-auto">
          Hệ thống sẽ đối chiếu các môn học chưa hoàn thành với dữ liệu trường đối tác và môn tương đương đã được audit từ tài liệu S27.
        </p>
      </div>

      {/* Segmented Switcher */}
      <div className="flex justify-center">
        <div className="bg-surface-container-high p-1 rounded-full inline-flex border border-surface-container">
          <button
            type="button"
            onClick={() => setActiveTab('EXCEL')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              activeTab === 'EXCEL'
                ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-base">upload_file</span>
            <span>Tải file Excel</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MANUAL')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              activeTab === 'MANUAL'
                ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-base">edit_note</span>
            <span>Nhập mã môn</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600 text-lg">error</span>
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-700 font-bold hover:underline">
            Đóng
          </button>
        </div>
      )}

      {/* Main Card */}
      {activeTab === 'EXCEL' ? (
        <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-sm border border-surface-container/80 flex flex-col gap-6">
          {/* Cute 3D Mascot Greeting Bubble */}
          <div className="bg-primary-fixed/30 border border-primary/20 rounded-2xl p-4 flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-sm shrink-0 border-2 border-white">
              <img
                src="/images/mascot_advisor.jpg"
                alt="3D Advisor Mascot"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-xs">
              <p className="font-bold text-primary">Trợ lý Cố vấn Học vụ FTU 🎓</p>
              <p className="text-on-surface-variant mt-0.5 leading-relaxed">
                Xin chào FTUer! Tải bảng điểm tín chỉ hoặc CTĐT vào đây, mình sẽ tự động đối soát và tìm ngay những trường có môn tương đương cho bạn nhé!
              </p>
            </div>
          </div>

          {/* Dropzone with 3D Icon */}
          <div className="relative group bg-surface-container-low/50 hover:bg-surface-container-low rounded-2xl p-8 transition-all duration-200 border-2 border-dashed border-primary/30 hover:border-primary flex flex-col items-center justify-center text-center">
            <input
              id="fileUploadInput"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="relative w-16 h-16 mb-3 rounded-2xl overflow-hidden shadow-md group-hover:scale-110 transition-transform animate-float">
              <img
                src="/images/3d_checklist.jpg"
                alt="3D Checklist Icon"
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-base font-bold text-on-surface mb-1">
              Kéo thả file bảng điểm vào đây
            </h3>
            <p className="text-xs text-on-surface-variant max-w-sm mb-5">
              Hỗ trợ định dạng <strong>.xlsx, .xls</strong> theo template hồ sơ trong <span className="text-primary font-medium">public/templates</span>
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <label
                htmlFor="fileUploadInput"
                className="px-5 py-2.5 rounded-full bg-primary text-on-primary text-sm font-bold shadow-sm hover:bg-primary-container transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">folder_open</span>
                <span>{isProcessing ? 'Đang đọc dữ liệu...' : 'Chọn file từ thiết bị'}</span>
              </label>

              <button
                type="button"
                onClick={handleUseSample}
                className="px-4 py-2.5 rounded-full bg-white hover:bg-surface-container text-on-surface text-sm font-semibold transition-all border border-surface-container inline-flex items-center gap-1.5 shadow-xs"
              >
                <span className="material-symbols-outlined text-base text-primary">bolt</span>
                <span>Dùng thử hồ sơ mẫu</span>
              </button>
            </div>
          </div>

          {/* Active File Loaded Feedback */}
          {courseCount > 0 && (
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">check</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-950 truncate max-w-xs sm:max-w-md">
                      {attachedFileName || 'Hồ sơ đã nhập (chưa có tên file)'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[11px] font-bold">
                      Đã nạp
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Đã nhận diện <strong>{courseCount} môn học</strong> ({passedCredits} tín chỉ đã đạt • {remainingCredits} tín chỉ mở để đổi)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    updateProfile({ courses: [], manualCourseCodes: [] });
                    setAttachedFileName(null);
                  }}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1"
                >
                  Xóa
                </button>
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-surface-container">
            <span className="text-xs text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-emerald-600">lock</span>
              Dữ liệu được xử lý trực tiếp trên trình duyệt, không lưu trữ công khai.
            </span>

            <button
              type="button"
              disabled={courseCount === 0}
              onClick={() => setCurrentStep(2)}
              className="w-full sm:w-auto px-7 py-3 rounded-full bg-primary text-on-primary text-sm font-bold shadow-md hover:bg-primary-container transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Tiếp tục: Rà soát môn học</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>
        </div>
      ) : (
        /* Manual Input Mode */
        <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-sm border border-surface-container/80 flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase">Khóa sinh viên</label>
              <select
                value={profile.cohort}
                onChange={(e) => updateProfile({ cohort: e.target.value })}
                className="w-full bg-surface-container-low rounded-xl py-2 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary border border-surface-container"
              >
                <option value="">Chọn khóa</option>
                <option value="K62">K62 (2023 - 2027)</option>
                <option value="K61">K61 (2022 - 2026)</option>
                <option value="K63">K63 (2024 - 2028)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase">Ngành / Khoa</label>
              <input
                value={profile.major}
                onChange={(e) => updateProfile({ major: e.target.value })}
                placeholder="Nhập đúng theo hồ sơ"
                className="w-full bg-surface-container-low rounded-xl py-2 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary border border-surface-container"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase">Chương trình</label>
              <select
                value={profile.program}
                onChange={(e) => updateProfile({ program: e.target.value as any })}
                className="w-full bg-surface-container-low rounded-xl py-2 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary border border-surface-container"
              >
                <option value="">Chưa xác định</option>
                <option value="CLC">Kinh tế Đối ngoại (Chất lượng cao)</option>
                <option value="Tiêu chuẩn">Kinh tế Đối ngoại (Tiêu chuẩn)</option>
                <option value="CTTT">Chương trình Tiên tiến (CTTT)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-on-surface">Mã học phần dự định quy đổi:</label>
              <button
                type="button"
                onClick={() => setManualText('KTE402, KTE408, TIN314, PLU422, KTE410, TCH341')}
                className="text-xs text-primary font-semibold hover:underline"
              >
                Điền mẫu gợi ý
              </button>
            </div>
            <textarea
              rows={3}
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="VD: KTE402, KTE408, TIN314, PLU422, KTE410, TCH341"
              className="w-full p-3.5 rounded-xl border border-surface-container bg-surface-container-low text-xs font-mono text-on-surface focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
            <p className="text-[11px] text-amber-700">
              Nhập mã môn chỉ tạo hồ sơ nháp cần xác minh; hệ thống không tự suy đoán tên môn hoặc số tín chỉ.
            </p>
          </div>

          <div className="pt-3 flex justify-end border-t border-surface-container">
            <button
              type="button"
              onClick={handleManualSubmit}
              className="px-6 py-2.5 rounded-full bg-primary text-on-primary text-sm font-bold hover:bg-primary-container transition-all shadow-sm flex items-center gap-2"
            >
              <span>Xác nhận & Tiếp tục</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
