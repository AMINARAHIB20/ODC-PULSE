export interface EmployabilityScoreInput {
  technicalSkillsAverage: number;
  quizAverage: number;
  projectScore: number;
  attendanceRate: number;
}

const EMPLOYABILITY_WEIGHTS = {
  technicalSkillsAverage: 0.4,
  quizAverage: 0.2,
  projectScore: 0.25,
  attendanceRate: 0.15,
} as const;

function normalizePercentage(name: string, value: number): number {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number.`);
  }

  return Math.min(100, Math.max(0, value));
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateTechnicalSkillsAverage(
  proficiencyLevels: readonly number[],
  maximumLevel = 5,
): number {
  if (!Number.isFinite(maximumLevel) || maximumLevel <= 0) {
    throw new RangeError("maximumLevel must be a positive finite number.");
  }

  if (proficiencyLevels.length === 0) return 0;

  const normalizedLevels = proficiencyLevels.map((level) => {
    if (!Number.isFinite(level)) {
      throw new TypeError("Each proficiency level must be a finite number.");
    }

    return Math.min(maximumLevel, Math.max(0, level));
  });
  const averageLevel =
    normalizedLevels.reduce((sum, level) => sum + level, 0) /
    normalizedLevels.length;

  return roundScore((averageLevel / maximumLevel) * 100);
}

export function calculateEmployabilityScore({
  technicalSkillsAverage,
  quizAverage,
  projectScore,
  attendanceRate,
}: EmployabilityScoreInput): number {
  const normalizedTechnicalSkills = normalizePercentage(
    "technicalSkillsAverage",
    technicalSkillsAverage,
  );
  const normalizedQuiz = normalizePercentage("quizAverage", quizAverage);
  const normalizedProject = normalizePercentage("projectScore", projectScore);
  const normalizedAttendance = normalizePercentage(
    "attendanceRate",
    attendanceRate,
  );

  return roundScore(
    normalizedTechnicalSkills * EMPLOYABILITY_WEIGHTS.technicalSkillsAverage +
      normalizedQuiz * EMPLOYABILITY_WEIGHTS.quizAverage +
      normalizedProject * EMPLOYABILITY_WEIGHTS.projectScore +
      normalizedAttendance * EMPLOYABILITY_WEIGHTS.attendanceRate,
  );
}
