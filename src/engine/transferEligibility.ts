import { StudentCourse } from '../types/curriculum';
import { SelectedStudyPlan } from '../types/studyPlan';
import { normalizeCode } from '../lib/dataIntegrity';

// Not passed is not sufficient: enrolled courses cannot be transferred either.
type CourseStatusFields = Pick<StudentCourse, 'isPassed' | 'isTaken' | 'status'>;

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

export function removeUnavailableTransfers(plan: SelectedStudyPlan, courses: StudentCourse[]): SelectedStudyPlan {
  const excludedCodes = new Set(courses.filter(course => !isAvailableForTransfer(course)).map(course => normalizeCode(course.courseCode)));
  const transferredCourses = plan.transferredCourses.filter(pair => !excludedCodes.has(normalizeCode(pair.ftuCourseCode)));
  if (transferredCourses.length === plan.transferredCourses.length) return plan;
  return { ...plan, transferredCourses, status: 'NEEDS_VERIFICATION', graduationSimulation: undefined };
}
