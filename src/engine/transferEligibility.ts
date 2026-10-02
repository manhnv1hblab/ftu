import { StudentCourse } from '../types/curriculum';
import { SelectedStudyPlan } from '../types/studyPlan';
import { normalizeCode } from '../lib/dataIntegrity';

// Not passed is not sufficient: enrolled courses cannot be transferred either.
export const isAvailableForTransfer = (course: Pick<StudentCourse, 'isPassed' | 'isTaken'>) =>
  !course.isPassed && !course.isTaken;

export function removeUnavailableTransfers(plan: SelectedStudyPlan, courses: StudentCourse[]): SelectedStudyPlan {
  const excludedCodes = new Set(courses.filter(course => !isAvailableForTransfer(course)).map(course => normalizeCode(course.courseCode)));
  const transferredCourses = plan.transferredCourses.filter(pair => !excludedCodes.has(normalizeCode(pair.ftuCourseCode)));
  if (transferredCourses.length === plan.transferredCourses.length) return plan;
  return { ...plan, transferredCourses, status: 'NEEDS_VERIFICATION', graduationSimulation: undefined };
}
