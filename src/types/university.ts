import { DataSourceRef } from './provenance';

export interface PartnerUniversity {
  id: string;
  name: string;
  aliasInTong?: string;
  region: string;
  country: string;
  quota: string;
  languages: string;
  requirements: string;
  statusAtFtu?: string;
  scholarship?: string;
  catalogueUrl?: string;
  source: DataSourceRef;
  // Presentation & UI properties
  vietnameseName?: string;
  city?: string;
  flag?: string;
  qsRank?: string;
  nationalRank?: string | number;
  minGpa?: number;
  minIelts?: number;
  hasDormitory?: boolean;
  hasScholarship?: boolean;
  logoUrl?: string;
  imageUrl?: string;
  galleryImages?: string[];
  description?: string;
  highlights?: string[];
  keyFaculties?: string[];
  semesterDates?: string;
  websiteUrl?: string;
  code?: string;
  climate?: string;
  visaType?: string;
  campusFacilities?: string[];
  costBreakdown?: {
    dormitoryMonthly?: string;
    mealsMonthly?: string;
    transportMonthly?: string;
    insuranceSemester?: string;
  };
  popularCourses?: string[];
  applicationDeadlineS27?: string;
  accreditation?: string;
  foundedYear?: number;
  studentCount?: string;
  campusType?: string;
}
