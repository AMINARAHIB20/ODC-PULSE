import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  generateEmployabilityAnalysis,
  type EmployabilityAnalysisContext,
} from "@/lib/ai/employability";
import { findTopCompanyMatches, type CompanyOfferInput } from "@/lib/scoring/companyMatch";
import { calculateEngagementScore } from "@/lib/scoring/engagement";
import {
  calculateEmployabilityScore,
  calculateTechnicalSkillsAverage,
} from "@/lib/scoring/employability";
import { calculateDropoutRisk } from "@/lib/scoring/dropoutRisk";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const requestSchema = z
  .object({
    learner_id: z.uuid(),
  })
  .strict();

interface LearnerRecord {
  id: string;
  learner_code: string;
  profiles: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
  programs: { name: string } | { name: string }[] | null;
}

interface AttendanceRecord {
  status: "present" | "absent" | "late" | "excused";
}

interface QuizRecord {
  score: number;
  max_score: number;
}

interface ProjectRecord {
  score: number | null;
}

interface SkillRecord {
  name: string;
  category: "technical" | "soft" | "language";
  proficiency_level: number;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function roundMetric(value: number): number {
  return Math.round(value * 10) / 10;
}

function firstRelation<T>(relation: T | T[] | null): T | null {
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation;
}

export async function POST(request: Request) {
  let requestBody: unknown;

  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsedRequest = requestSchema.safeParse(requestBody);

  if (!parsedRequest.success) {
    return NextResponse.json(
      { error: "A valid learner_id is required." },
      { status: 400 },
    );
  }

  try {
    const supabase = createSupabaseAdminClient();
    const learnerId = parsedRequest.data.learner_id;
    const learnerResult = await supabase
      .from("learners")
      .select(
        "id, learner_code, profiles(full_name, email), programs(name)",
      )
      .eq("id", learnerId)
      .maybeSingle();

    if (learnerResult.error) {
      console.error("AI route learner query failed:", learnerResult.error.message);
      return NextResponse.json(
        { error: "Unable to load the learner." },
        { status: 500 },
      );
    }

    if (!learnerResult.data) {
      return NextResponse.json({ error: "Learner not found." }, { status: 404 });
    }

    const [attendanceResult, quizResult, projectResult, skillsResult, offersResult] =
      await Promise.all([
        supabase
          .from("attendance_records")
          .select("status")
          .eq("learner_id", learnerId),
        supabase
          .from("quiz_results")
          .select("score, max_score")
          .eq("learner_id", learnerId),
        supabase
          .from("projects")
          .select("score")
          .eq("learner_id", learnerId)
          .not("score", "is", null),
        supabase
          .from("skills")
          .select("name, category, proficiency_level")
          .eq("learner_id", learnerId)
          .order("category")
          .order("name"),
        supabase
          .from("company_offers")
          .select("id, company_name, title, required_skills")
          .eq("status", "open"),
      ]);

    const queryError =
      attendanceResult.error ??
      quizResult.error ??
      projectResult.error ??
      skillsResult.error ??
      offersResult.error;

    if (queryError) {
      console.error("AI route profile query failed:", queryError.message);
      return NextResponse.json(
        { error: "Unable to prepare learner data." },
        { status: 500 },
      );
    }

    const learner = learnerResult.data as LearnerRecord;
    const attendanceRecords = (attendanceResult.data ?? []) as AttendanceRecord[];
    const quizRecords = (quizResult.data ?? []) as QuizRecord[];
    const projectRecords = (projectResult.data ?? []) as ProjectRecord[];
    const skillRecords = (skillsResult.data ?? []) as SkillRecord[];
    const offers = (offersResult.data ?? []) as CompanyOfferInput[];
    const countedAttendance = attendanceRecords.filter(
      (record) => record.status !== "excused",
    );
    const attendedSessions = countedAttendance.filter(
      (record) => record.status === "present" || record.status === "late",
    ).length;
    const attendanceRate = roundMetric(
      countedAttendance.length
        ? (attendedSessions / countedAttendance.length) * 100
        : 0,
    );
    const quizAverage = roundMetric(
      average(
        quizRecords.map((record) =>
          Number(record.max_score) > 0
            ? (Number(record.score) / Number(record.max_score)) * 100
            : 0,
        ),
      ),
    );
    const projectAverage = roundMetric(
      average(projectRecords.map((record) => Number(record.score ?? 0))),
    );
    const technicalSkillsAverage = calculateTechnicalSkillsAverage(
      skillRecords
        .filter((skill) => skill.category === "technical")
        .map((skill) => Number(skill.proficiency_level)),
    );
    const engagementScore = calculateEngagementScore({
      attendanceRate,
      quizAverage,
      projectScore: projectAverage,
    });
    const employabilityScore = calculateEmployabilityScore({
      technicalSkillsAverage,
      quizAverage,
      projectScore: projectAverage,
      attendanceRate,
    });
    const dropoutRisk = calculateDropoutRisk({ attendanceRate, quizAverage });
    const profile = firstRelation(learner.profiles);
    const program = firstRelation(learner.programs);
    const companyMatches = findTopCompanyMatches(
      skillRecords.map((skill) => skill.name),
      offers,
    );
    const analysisContext: EmployabilityAnalysisContext = {
      learner: {
        id: learner.id,
        fullName: profile?.full_name ?? "Unnamed learner",
        programName: program?.name ?? null,
      },
      metrics: {
        attendanceRate,
        quizAverage,
        projectAverage,
        technicalSkillsAverage,
        engagementScore,
        employabilityScore,
        dropoutRisk: dropoutRisk.level,
      },
      skills: skillRecords.map((skill) => ({
        name: skill.name,
        category: skill.category,
        proficiencyLevel: Number(skill.proficiency_level),
      })),
      companyMatches,
    };
    const generated = await generateEmployabilityAnalysis(analysisContext);
    const generatedAt = new Date().toISOString();
    const analysisRow = {
      learner_id: learnerId,
      analysis_type: "employability",
      status: "completed",
      employability_score: employabilityScore,
      summary: generated.analysis.learnerSummary,
      strengths: generated.analysis.strengths,
      weaknesses: generated.analysis.weaknesses,
      recommendations: [generated.analysis.employabilityRecommendation],
      recommended_career_path: generated.analysis.recommendedCareerPath,
      skills_to_improve: generated.analysis.skillsToImprove,
      employability_recommendation:
        generated.analysis.employabilityRecommendation,
      matched_offer_ids: companyMatches.map((match) => match.offerId),
      model_name: generated.model,
      workflow_run_id: generated.responseId,
      error_message: null,
      generated_at: generatedAt,
    };
    const savedResult = await supabase
      .from("ai_analyses")
      .upsert(analysisRow, { onConflict: "learner_id,analysis_type" })
      .select("id, generated_at")
      .single();

    if (savedResult.error) {
      console.error("AI analysis persistence failed:", savedResult.error.message);
      return NextResponse.json(
        { error: "Analysis generated but could not be saved." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      analysis_id: savedResult.data.id,
      learner_id: learnerId,
      metrics: {
        attendance_rate: attendanceRate,
        quiz_average: quizAverage,
        project_average: projectAverage,
        engagement_score: engagementScore,
        employability_score: employabilityScore,
        dropout_risk: dropoutRisk.level,
      },
      company_matches: companyMatches,
      analysis: generated.analysis,
      generated_at: savedResult.data.generated_at,
    });
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      console.error("OpenAI API error:", error.status, error.message);

      if (error.status === 401) {
        return NextResponse.json(
          { error: "OpenAI credentials are not configured correctly." },
          { status: 503 },
        );
      }

      if (error.status === 429) {
        return NextResponse.json(
          { error: "OpenAI rate limit or quota exceeded. Try again later." },
          { status: 429 },
        );
      }

      return NextResponse.json(
        { error: "OpenAI could not generate the analysis." },
        { status: 502 },
      );
    }

    console.error("Unexpected employability API error:", error);
    return NextResponse.json(
      { error: "The employability analysis could not be completed." },
      { status: 500 },
    );
  }
}
