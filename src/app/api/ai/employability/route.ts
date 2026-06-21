import { NextResponse } from "next/server";
import { z } from "zod";

import { findTopCompanyMatches, type CompanyOfferInput } from "@/lib/scoring/companyMatch";
import { calculateEngagementScore } from "@/lib/scoring/engagement";
import {
  calculateEmployabilityScore,
  calculateTechnicalSkillsAverage,
} from "@/lib/scoring/employability";
import { calculateDropoutRisk } from "@/lib/scoring/dropoutRisk";
import { getN8nEnvironment } from "@/lib/n8n/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const requestSchema = z
  .object({
    learnerId: z.uuid(),
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

function isSuccessfulWebhookPayload(payload: unknown): boolean {
  return (
    !!payload &&
    typeof payload === "object" &&
    "success" in payload &&
    payload.success === true
  );
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
      { error: "A valid learnerId is required." },
      { status: 400 },
    );
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { learnerId } = parsedRequest.data;
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
    const projectScore = roundMetric(
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
      projectScore,
    });
    const employabilityScore = calculateEmployabilityScore({
      technicalSkillsAverage,
      quizAverage,
      projectScore,
      attendanceRate,
    });
    const dropoutRisk = calculateDropoutRisk({ attendanceRate, quizAverage });
    const profile = firstRelation(learner.profiles);
    const program = firstRelation(learner.programs);
    const companyMatches = findTopCompanyMatches(
      skillRecords.map((skill) => skill.name),
      offers,
    );
    const { webhookUrl, webhookSecret } = getN8nEnvironment();
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ODC-Webhook-Secret": webhookSecret,
      },
      body: JSON.stringify({
        version: "1.0",
        requestedAt: new Date().toISOString(),
        learner: {
          id: learner.id,
          code: learner.learner_code,
          fullName: profile?.full_name ?? "Unnamed learner",
          email: profile?.email ?? null,
          programName: program?.name ?? null,
        },
        metrics: {
          attendanceRate,
          quizAverage,
          projectScore,
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
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(25_000),
    });

    if (!webhookResponse.ok) {
      console.error("n8n webhook failed with status:", webhookResponse.status);
      return NextResponse.json(
        { error: "The AI workflow failed. Please try again." },
        { status: 502 },
      );
    }

    const webhookPayload: unknown = await webhookResponse.json().catch(() => null);

    if (!isSuccessfulWebhookPayload(webhookPayload)) {
      console.error("n8n webhook returned an invalid success response.");
      return NextResponse.json(
        { error: "The AI workflow returned an invalid response." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      learnerId,
      message: "Employability analysis generated successfully.",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json(
        { error: "The AI workflow timed out. Please try again." },
        { status: 504 },
      );
    }

    console.error("Unexpected employability API error:", error);
    return NextResponse.json(
      { error: "The employability workflow is not configured or unavailable." },
      { status: 503 },
    );
  }
}
