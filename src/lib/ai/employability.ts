import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import type { CompanyMatchResult } from "@/lib/scoring/companyMatch";
import type { DropoutRiskLevel } from "@/lib/scoring/dropoutRisk";

const analysisSchema = z.object({
  learnerSummary: z.string().min(20).max(700),
  strengths: z.array(z.string().min(3).max(180)).min(2).max(5),
  weaknesses: z.array(z.string().min(3).max(180)).min(1).max(5),
  recommendedCareerPath: z.string().min(10).max(300),
  skillsToImprove: z.array(z.string().min(2).max(120)).min(1).max(5),
  employabilityRecommendation: z.string().min(20).max(700),
});

export type EmployabilityAnalysis = z.infer<typeof analysisSchema>;

export interface EmployabilityAnalysisContext {
  learner: {
    id: string;
    fullName: string;
    programName: string | null;
  };
  metrics: {
    attendanceRate: number;
    quizAverage: number;
    projectAverage: number;
    technicalSkillsAverage: number;
    engagementScore: number;
    employabilityScore: number;
    dropoutRisk: DropoutRiskLevel;
  };
  skills: Array<{
    name: string;
    category: string;
    proficiencyLevel: number;
  }>;
  companyMatches: CompanyMatchResult[];
}

export interface GeneratedEmployabilityAnalysis {
  analysis: EmployabilityAnalysis;
  model: string;
  responseId: string;
}

function requireServerEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing ${name}. Add it to .env.local and restart Next.js.`);
  }

  return value;
}

export async function generateEmployabilityAnalysis(
  context: EmployabilityAnalysisContext,
): Promise<GeneratedEmployabilityAnalysis> {
  const apiKey = requireServerEnvironmentVariable("OPENAI_API_KEY");
  const model = requireServerEnvironmentVariable("OPENAI_MODEL");
  const client = new OpenAI({ apiKey, maxRetries: 1, timeout: 25_000 });
  const response = await client.responses.parse({
    model,
    instructions: [
      "Tu es un conseiller expert en employabilité pour Orange Digital Center.",
      "Rédige toute l'analyse en français professionnel, clair et encourageant.",
      "Utilise uniquement les données fournies et n'invente aucune expérience.",
      "Ne modifie pas les scores, le niveau de risque ou les correspondances d'offres.",
      "Donne des recommandations concrètes adaptées à un profil junior.",
    ].join(" "),
    input: JSON.stringify(context),
    text: {
      format: zodTextFormat(analysisSchema, "employability_analysis"),
    },
  });

  if (!response.output_parsed) {
    throw new Error("OpenAI returned no structured employability analysis.");
  }

  return {
    analysis: response.output_parsed,
    model,
    responseId: response.id,
  };
}
