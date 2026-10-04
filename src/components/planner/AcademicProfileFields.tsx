'use client';
import React, { useState } from 'react';
import { useStudent } from '../../context/StudentContext';
import { academicPrograms, cohorts, ProfileErrors } from '../../lib/profileValidation';

export const inputClass = 'w-full min-w-0 rounded-xl border border-surface-container bg-surface-container-low px-3 py-2 text-sm text-on-surface focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50';
export function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return <div className="flex min-w-0 flex-col gap-1.5"><label className="text-xs font-bold text-on-surface" htmlFor={id}>{label} <span aria-hidden="true">*</span></label>{children}{error && <p id={`${id}-error`} className="text-xs text-rose-700">{error}</p>}</div>;
}
const searchable = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();
export function AcademicProfileFields({ errors = {} }: { errors?: ProfileErrors }) {
  const { profile, updateProfile } = useStudent();
  const [majorSearch, setMajorSearch] = useState('');
  const [programSearch, setProgramSearch] = useState('');
  const available = academicPrograms.filter(p => p.cohorts.includes(profile.cohort));
  const majors = Array.from(new Map(available.map(p => [p.majorId, p.majorName])).entries());
  const programs = available.filter(p => p.majorId === profile.majorId);
  const clearProgram = { programId: '', programName: '', programSourceUrl: '', program: '' as const };
  const attributes = (id: string) => ({ id, 'aria-invalid': !!errors[id], 'aria-describedby': errors[id] ? `${id}-error` : undefined, className: inputClass });
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Field id="profile-cohort" label="Khóa" error={errors['profile-cohort']}><select {...attributes('profile-cohort')} value={profile.cohort} onChange={e => {
      const cohort = e.target.value;
      const selectionFits = academicPrograms.some(p => p.id === profile.programId && p.cohorts.includes(cohort));
      const majorFits = academicPrograms.some(p => p.majorId === profile.majorId && p.cohorts.includes(cohort));
      updateProfile({ cohort, ...(!selectionFits ? clearProgram : {}), ...(!majorFits ? { majorId: '', major: '' } : {}) });
      setMajorSearch(''); setProgramSearch('');
    }}><option value="">Chọn khóa</option>{cohorts.map(c => <option key={c}>{c}</option>)}</select></Field>
    <Field id="profile-major" label="Ngành" error={errors['profile-major']}>
      <input className={inputClass} type="search" aria-label="Tìm ngành" placeholder="Tìm ngành…" value={majorSearch} onChange={e => setMajorSearch(e.target.value)} disabled={!profile.cohort} />
      <select {...attributes('profile-major')} value={profile.majorId || ''} disabled={!profile.cohort} onChange={e => { updateProfile({ majorId: e.target.value, major: majors.find(([id]) => id === e.target.value)?.[1] || '', ...clearProgram }); setProgramSearch(''); }}><option value="">Chọn ngành</option>{majors.filter(([id, name]) => id === profile.majorId || searchable(name).includes(searchable(majorSearch))).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
    </Field>
    <div className="md:col-span-2"><Field id="profile-program" label="Chuyên ngành / Chương trình đào tạo" error={errors['profile-program']}>
      <input className={inputClass} type="search" aria-label="Tìm chương trình" placeholder="Tìm chuyên ngành hoặc chương trình…" value={programSearch} onChange={e => setProgramSearch(e.target.value)} disabled={!profile.majorId} />
      <select {...attributes('profile-program')} value={profile.programId || ''} disabled={!profile.majorId} onChange={e => updateProfile({ ...clearProgram, programId: e.target.value })}><option value="">Chọn chương trình</option>{programs.filter(p => p.id === profile.programId || searchable(p.name).includes(searchable(programSearch))).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      {profile.programName && <p className="text-xs leading-relaxed text-on-surface-variant">{profile.programName} · <a className="text-primary underline" href={profile.programSourceUrl} target="_blank" rel="noreferrer">Danh mục FTU</a></p>}
      {!profile.programId && (profile.major || profile.program) && <p className="text-xs text-amber-700">Thông tin đã lưu: {profile.major} {profile.program}. Hãy chọn lại chương trình trong danh mục để xác nhận.</p>}
    </Field></div>
  </div>;
}
