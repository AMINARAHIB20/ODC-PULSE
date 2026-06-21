import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type LearnerRiskStatus = "high" | "medium" | "low";

export interface LearnerRiskRow {
  id: string;
  learnerCode: string;
  name: string;
  attendanceRate: number;
  quizScore: number;
  employabilityScore: number;
  riskStatus: LearnerRiskStatus;
  readyForInternship: boolean;
}

export interface LearnerRiskTableProps {
  learners: LearnerRiskRow[];
}

const riskLabels: Record<LearnerRiskStatus, string> = {
  high: "High risk",
  medium: "Needs attention",
  low: "On track",
};

function RiskBadge({ status }: { status: LearnerRiskStatus }) {
  if (status === "high") {
    return <Badge variant="destructive">{riskLabels[status]}</Badge>;
  }

  if (status === "medium") {
    return (
      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
        {riskLabels[status]}
      </Badge>
    );
  }

  return (
    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
      {riskLabels[status]}
    </Badge>
  );
}

export function LearnerRiskTable({ learners }: LearnerRiskTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Learner</TableHead>
          <TableHead>Attendance</TableHead>
          <TableHead>Quiz average</TableHead>
          <TableHead>Employability</TableHead>
          <TableHead>Risk status</TableHead>
          <TableHead>Internship</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {learners.map((learner) => (
          <TableRow key={learner.id}>
            <TableCell>
              <Link
                href={`/learners/${learner.id}`}
                className="font-medium hover:text-orange-600 hover:underline"
              >
                {learner.name}
              </Link>
              <div className="text-xs text-muted-foreground">
                {learner.learnerCode}
              </div>
            </TableCell>
            <TableCell>{learner.attendanceRate.toFixed(1)}%</TableCell>
            <TableCell>{learner.quizScore.toFixed(1)}%</TableCell>
            <TableCell>{learner.employabilityScore.toFixed(1)}</TableCell>
            <TableCell>
              <RiskBadge status={learner.riskStatus} />
            </TableCell>
            <TableCell>
              <Badge variant={learner.readyForInternship ? "default" : "outline"}>
                {learner.readyForInternship ? "Ready" : "Developing"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
