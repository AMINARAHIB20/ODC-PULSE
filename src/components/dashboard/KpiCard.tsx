import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface KpiCardProps {
  label: string;
  value: string | number;
  description: string;
}

export function KpiCard({ label, value, description }: KpiCardProps) {
  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
