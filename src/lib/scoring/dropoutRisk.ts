export type DropoutRiskLevel = "high" | "medium" | "low";

export interface DropoutRiskInput {
  attendanceRate: number;
  quizAverage: number;
}

export interface DropoutRiskAssessment {
  level: DropoutRiskLevel;
  reasons: string[];
}

function normalizePercentage(name: string, value: number): number {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number.`);
  }

  return Math.min(100, Math.max(0, value));
}

export function calculateDropoutRisk({
  attendanceRate,
  quizAverage,
}: DropoutRiskInput): DropoutRiskAssessment {
  const attendance = normalizePercentage("attendanceRate", attendanceRate);
  const quiz = normalizePercentage("quizAverage", quizAverage);

  if (attendance < 60 || quiz < 50) {
    const reasons: string[] = [];

    if (attendance < 60) reasons.push("Attendance is below 60%.");
    if (quiz < 50) reasons.push("Quiz average is below 50%.");

    return { level: "high", reasons };
  }

  if (attendance < 75 || quiz < 65) {
    const reasons: string[] = [];

    if (attendance < 75) reasons.push("Attendance is below 75%.");
    if (quiz < 65) reasons.push("Quiz average is below 65%.");

    return { level: "medium", reasons };
  }

  return {
    level: "low",
    reasons: ["Attendance and quiz performance meet the low-risk thresholds."],
  };
}
