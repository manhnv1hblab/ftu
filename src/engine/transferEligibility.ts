import { StudentCourse } from '../types/curriculum';
import { SelectedStudyPlan } from '../types/studyPlan';
import { normalizeCode } from '../lib/dataIntegrity';

// Not passed is not sufficient: enrolled courses cannot be transferred either.
type CourseStatusFields = Pick<StudentCourse, 'isPassed' | 'isTaken' | 'status'>;

const NON_TRANSFER_COURSE_CODES = new Set(['KTE504', 'KTE526', 'HPTN', 'KLTN', 'KTE525']);
const NON_TRANSFER_COURSE_NAME_MARKERS = ['thuc tap giua khoa', 'khoa luan tot nghiep', 'hoc phan tot nghiep'];

function normalizeCourseName(value: string): string {
  return value
    .normalize('NFKC')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('vi-VN');
}

const explicitStatus = (course: CourseStatusFields) =>
  course.status === 'PASSED' || course.status === 'IN_PROGRESS' || course.status === 'NOT_TAKEN'
    ? course.status
    : undefined;

/** The explicit review status is authoritative when present; booleans support older imports. */
export const isCoursePassed = (course: CourseStatusFields) =>
  explicitStatus(course) ? explicitStatus(course) === 'PASSED' : course.isPassed;

export const isCourseInProgress = (course: CourseStatusFields) =>
  explicitStatus(course) ? explicitStatus(course) === 'IN_PROGRESS' : course.isTaken && !course.isPassed;

export const isAvailableForTransfer = (course: CourseStatusFields) =>
  !isCoursePassed(course) && !isCourseInProgress(course);

/** Graduation thesis and midterm internship are FTU obligations, not exchange equivalence courses. */
export function isExcludedFromTransfer(course: Pick<StudentCourse, 'courseCode' | 'courseName'>): boolean {
  const code = normalizeCode(course.courseCode);
  const name = normalizeCourseName(course.courseName);
  return NON_TRANSFER_COURSE_CODES.has(code)
    || NON_TRANSFER_COURSE_NAME_MARKERS.some(marker => name.includes(marker));
}

export function removeUnavailableTransfers(plan: SelectedStudyPlan, courses: StudentCourse[]): SelectedStudyPlan {
  const excludedCodes = new Set(courses
    .filter(course => !isAvailableForTransfer(course) || isExcludedFromTransfer(course))
    .map(course => normalizeCode(course.courseCode)));
  const transferredCourses = plan.transferredCourses.filter(pair =>
    !excludedCodes.has(normalizeCode(pair.ftuCourseCode))
      && !isExcludedFromTransfer({ courseCode: pair.ftuCourseCode, courseName: pair.ftuCourseName })
  );
  if (transferredCourses.length === plan.transferredCourses.length) return plan;
  return { ...plan, transferredCourses, status: 'NEEDS_VERIFICATION', graduationSimulation: undefined };
}
