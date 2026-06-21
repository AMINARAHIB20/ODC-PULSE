import { Progress } from "@/components/ui/progress";

export interface EmployabilityScoreProps {
  score: number;
}

export function EmployabilityScore({ score }: EmployabilityScoreProps) {
  const normalizedScore = Math.min(100, Math.max(0, score));

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Employability score
          </p>
          <p className="mt-1 text-4xl font-semibold tracking-tight">
            {normalizedScore.toFixed(1)}
            <span className="text-lg text-muted-foreground">/100</span>
          </p>
        </div>
        <p className="text-right text-xs text-muted-foreground">
          Skills, quizzes, projects, and attendance
        </p>
      </div>
      <Progress
        value={normalizedScore}
        className="mt-4 h-2 [&_[data-slot=progress-indicator]]:bg-orange-500"
      />
    </div>
  );
}
