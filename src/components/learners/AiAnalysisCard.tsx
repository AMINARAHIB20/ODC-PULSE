"use client";

import { AlertCircle, CheckCircle2, LoaderCircle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface AiAnalysisView {
  score: number | null;
  summary: string;
  strengths: string[];
  recommendations: string[];
  generatedLabel: string;
}

export interface AiAnalysisCardProps {
  learnerId: string;
  analysis: AiAnalysisView | null;
}

type RequestState = "idle" | "loading" | "success" | "error";

function getApiError(payload: unknown): string {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return "The analysis could not be generated. Please try again.";
}

export function AiAnalysisCard({ learnerId, analysis }: AiAnalysisCardProps) {
  const router = useRouter();
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function generateAnalysis() {
    setRequestState("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/ai/employability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnerId }),
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getApiError(payload));
      }

      setRequestState("success");
      router.refresh();
    } catch (error) {
      setRequestState("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while generating the analysis.",
      );
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <CardTitle>AI employability analysis</CardTitle>
            <CardDescription className="mt-1">
              Latest AI-generated strengths and recommended next steps.
            </CardDescription>
          </div>
          <Button
            type="button"
            onClick={generateAnalysis}
            disabled={requestState === "loading"}
          >
            {requestState === "loading" ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Sparkles />
            )}
            {requestState === "loading"
              ? "Generating analysis..."
              : "Generate AI Employability Analysis"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {requestState === "success" && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
            <CheckCircle2 className="size-4" />
            Analysis generated successfully. Profile data is refreshing.
          </div>
        )}
        {requestState === "error" && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {analysis ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{analysis.summary}</p>
              <div className="text-right">
                {analysis.score !== null && (
                  <p className="text-lg font-semibold">
                    {analysis.score.toFixed(1)}/100
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {analysis.generatedLabel}
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <AnalysisList title="Strengths" items={analysis.strengths} />
              <AnalysisList
                title="Recommendations"
                items={analysis.recommendations}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No completed AI analysis is available for this learner yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AnalysisList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-sm font-medium">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          {items.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">No items provided.</p>
      )}
    </div>
  );
}
