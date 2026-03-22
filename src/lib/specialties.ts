/**
 * SSOT (Single Source of Truth) for hospital specialties.
 * All specialty references across the codebase should import from here.
 * DB migration for the specialties enum is planned separately.
 */

export const SPECIALTY_LIST = ['심장내과', '신경외과', '외상외과', '소아과', '정형외과'] as const;

export type Specialty = (typeof SPECIALTY_LIST)[number];
