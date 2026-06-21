import { Badge } from "@/components/ui/badge";
import type { DropoutRiskLevel } from "@/lib/scoring/dropoutRisk";

export interface RiskBadgeProps {
  level: DropoutRiskLevel;
}

const riskLabels: Record<DropoutRiskLevel, string> = {
  high: "High dropout risk",
  medium: "Medium dropout risk",
  low: "Low dropout risk",
};

export function RiskBadge({ level }: RiskBadgeProps) {
  if (level === "high") {
    return <Badge variant="destructive">{riskLabels[level]}</Badge>;
  }

  if (level === "medium") {
    return (
      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
        {riskLabels[level]}
      </Badge>
    );
  }

  return (
    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
      {riskLabels[level]}
    </Badge>
  );
}
