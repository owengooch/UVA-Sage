import type { StudentProfileInput } from "@/types/domain";

/** Normalize JSON from localStorage (older saves used `ceTrack`). */
export function parseStoredProfile(json: string): StudentProfileInput {
  const p = JSON.parse(json) as StudentProfileInput & { ceTrack?: string };
  const { ceTrack, ...rest } = p;
  return {
    ...rest,
    majorTrack: rest.majorTrack ?? ceTrack,
    completedCourseCodes: rest.completedCourseCodes ?? [],
    outsideInterestDetails: rest.outsideInterestDetails ?? [],
    studyAbroadInterests: rest.studyAbroadInterests ?? []
  };
}
