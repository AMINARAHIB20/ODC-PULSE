import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { CompanyMatchResult } from "@/lib/scoring/companyMatch";

export interface MatchingCardProps {
  match: CompanyMatchResult;
}

export function MatchingCard({ match }: MatchingCardProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{match.title}</CardTitle>
            <CardDescription>{match.companyName}</CardDescription>
          </div>
          <Badge variant="outline">{match.matchPercentage}% match</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress
          value={match.matchPercentage}
          className="h-2 [&_[data-slot=progress-indicator]]:bg-orange-500"
        />
        <p className="text-sm text-muted-foreground">{match.explanation}</p>
        <SkillGroup title="Matching skills" skills={match.matchingSkills} />
        <SkillGroup title="Missing skills" skills={match.missingSkills} />
      </CardContent>
    </Card>
  );
}

function SkillGroup({ title, skills }: { title: string; skills: string[] }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {skills.length > 0 ? (
          skills.map((skill) => (
            <Badge key={skill} variant="secondary">
              {skill}
            </Badge>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">None</span>
        )}
      </div>
    </div>
  );
}
