/**
 * `electiveFulfillments` tag prefixes aligned with each program’s catalog (see Undergraduate Record).
 * Used for pool filtering, ranking boosts, and major-aware elective section headings on the dashboard.
 */
export const ELECTIVE_PREFIXES_BY_MAJOR: Record<string, string[]> = {
  "Aerospace Engineering": ["aero:", "mae:", "seas:"],
  "Biomedical Engineering": ["seas:"],
  "Chemical Engineering": ["che:", "seas:"],
  "Civil Engineering": ["ce:", "seas:"],
  "Computer Engineering": ["cpe:", "ee:", "seas:"],
  "Computer Science (Engineering)": ["seas:"],
  "Electrical Engineering": ["ee:", "seas:"],
  "Materials Science and Engineering": ["mse:", "seas:"],
  "Mechanical Engineering": ["mae:", "aero:", "seas:"],
  "Systems Engineering": ["sys:", "seas:"]
};
