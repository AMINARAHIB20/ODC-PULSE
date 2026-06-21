import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface LearnerSkillView {
  name: string;
  category: string;
  proficiencyLevel: number;
}

export interface LearnerProfileProps {
  fullName: string;
  email: string;
  learnerCode: string;
  programName: string;
  skills: LearnerSkillView[];
}

export function LearnerProfile({
  fullName,
  email,
  learnerCode,
  programName,
  skills,
}: LearnerProfileProps) {
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <CardTitle className="text-2xl">{fullName}</CardTitle>
            <CardDescription className="mt-1">{email}</CardDescription>
          </div>
          <Badge variant="outline">{learnerCode}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Program
          </p>
          <p className="mt-1 font-medium">{programName}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Skills
          </p>
          {skills.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge key={`${skill.category}-${skill.name}`} variant="secondary">
                  {skill.name} · {skill.proficiencyLevel}/5
                </Badge>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              No skills recorded yet.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
