import { StudentCourse, ElectiveGroupProgress } from '../types/curriculum';

export function calculateElectiveGroups(courses: StudentCourse[]): Record<string, ElectiveGroupProgress> {
  const groups: Record<string, ElectiveGroupProgress> = {};

  for (const c of courses) {
    if (!c.electiveGroup) continue;

    const gId = String(c.electiveGroup).trim();
    if (!groups[gId]) {
      groups[gId] = {
        groupCode: gId,
        minCredits: c.minCredits || 0,
        maxCredits: c.maxCredits || 0,
        passedCredits: 0,
        remainingCredits: 0,
        totalAvailableCourses: 0,
        remainingCourses: []
      };
    }

    groups[gId].totalAvailableCourses += 1;

    // Use isPassed to determine completed credit
    if (c.isPassed) {
      groups[gId].passedCredits += c.credits;
    } else {
      groups[gId].remainingCourses.push(c);
    }
  }

  // Calculate actual remaining credits required for each group
  for (const gId in groups) {
    const g = groups[gId];
    const diff = g.minCredits - g.passedCredits;
    g.remainingCredits = diff > 0 ? diff : 0;
  }

  return groups;
}

/**
 * Calculates credit reduction when taking new courses in elective groups.
 * Ensures surplus credits in one group do not wipe obligations in another.
 */
export function calculateElectiveDeductions(
  coursesTakenAtHost: { ftuCourseCode: string; credits: number; electiveGroup?: string | null }[],
  initialGroups: Record<string, ElectiveGroupProgress>
): {
  updatedGroups: Record<string, ElectiveGroupProgress>;
  effectiveCreditsDeducted: number;
  wastedExcessCredits: number;
} {
  // Deep clone groups
  const updatedGroups: Record<string, ElectiveGroupProgress> = JSON.parse(JSON.stringify(initialGroups));
  let effectiveCreditsDeducted = 0;
  let wastedExcessCredits = 0;

  for (const course of coursesTakenAtHost) {
    if (!course.electiveGroup || !updatedGroups[course.electiveGroup]) {
      // Mandatory course or non-grouped elective
      effectiveCreditsDeducted += course.credits;
      continue;
    }

    const group = updatedGroups[course.electiveGroup];
    if (group.remainingCredits > 0) {
      const deduction = Math.min(course.credits, group.remainingCredits);
      group.remainingCredits -= deduction;
      group.passedCredits += course.credits;
      effectiveCreditsDeducted += deduction;
      const excess = course.credits - deduction;
      if (excess > 0) {
        wastedExcessCredits += excess;
      }
    } else {
      // Group already completed! Extra courses do not reduce debts in other groups
      group.passedCredits += course.credits;
      wastedExcessCredits += course.credits;
    }
  }

  return {
    updatedGroups,
    effectiveCreditsDeducted,
    wastedExcessCredits
  };
}
