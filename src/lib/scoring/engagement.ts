export interface EngagementScoreInput {
  attendanceRate: number;
  quizAverage: number;
  projectScore: number;
}

const ENGAGEMENT_WEIGHTS = {
  attendanceRate: 0.5,
  quizAverage: 0.3,
  projectScore: 0.2,
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

export function calculateEngagementScore({
  attendanceRate,
  quizAverage,
  projectScore,
}: EngagementScoreInput): number {
  const normalizedAttendance = normalizePercentage(
    "attendanceRate",
    attendanceRate,
  );
  const normalizedQuiz = normalizePercentage("quizAverage", quizAverage);
  const normalizedProject = normalizePercentage("projectScore", projectScore);

  return roundScore(
    normalizedAttendance * ENGAGEMENT_WEIGHTS.attendanceRate +
      normalizedQuiz * ENGAGEMENT_WEIGHTS.quizAverage +
      normalizedProject * ENGAGEMENT_WEIGHTS.projectScore,
  );
}
