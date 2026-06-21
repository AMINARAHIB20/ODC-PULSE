import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { MatchingCard } from "@/components/companies/MatchingCard";
import {
  AiAnalysisCard,
  type AiAnalysisView,
} from "@/components/learners/AiAnalysisCard";
import { EmployabilityScore } from "@/components/learners/EmployabilityScore";
import {
  LearnerProfile,
  type LearnerSkillView,
} from "@/components/learners/LearnerProfile";
import { RiskBadge } from "@/components/learners/RiskBadge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { calculateEngagementScore } from "@/lib/scoring/engagement";
import {
  calculateEmployabilityScore,
  calculateTechnicalSkillsAverage,
} from "@/lib/scoring/employability";
import { calculateDropoutRisk } from "@/lib/scoring/dropoutRisk";
import {
  findTopCompanyMatches,
  type CompanyMatchResult,
  type CompanyOfferInput,
} from "@/lib/scoring/companyMatch";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

interface AnalysisRecord {
  employability_score: number | null;
  summary: string | null;
  strengths: unknown;
  weaknesses: unknown;
  recommendations: unknown;
  recommended_career_path: string | null;
  skills_to_improve: unknown;
  employability_recommendation: string | null;
  generated_at: string | null;
  created_at: string;
}

interface LearnerPageData {
  learnerId: string;
  fullName: string;
  email: string;
  learnerCode: string;
  programName: string;
  attendanceRate: number;
  quizAverage: number;
  projectScore: number;
  engagementScore: number;
  employabilityScore: number;
  risk: ReturnType<typeof calculateDropoutRisk>;
  skills: LearnerSkillView[];
  analysis: AiAnalysisView | null;
  companyMatches: CompanyMatchResult[];
}

type LearnerPageResult =
  | { status: "success"; data: LearnerPageData }
  | { status: "not-found" }
  | { status: "error" };

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

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function formatAnalysisDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Casablanca",
  }).format(new Date(value));
}

async function getLearnerPageData(learnerId: string): Promise<LearnerPageResult> {
  try {
    const supabase = createSupabaseAdminClient();
    const learnerResult = await supabase
      .from("learners")
      .select(
        "id, learner_code, profiles(full_name, email), programs(name)",
      )
      .eq("id", learnerId)
      .maybeSingle();

    if (learnerResult.error) {
      console.error("Failed to load learner:", learnerResult.error.message);
      return { status: "error" };
    }

    if (!learnerResult.data) return { status: "not-found" };

    const [attendanceResult, quizResult, projectResult, skillsResult, analysisResult, offersResult] =
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
          .from("ai_analyses")
          .select(
            "employability_score, summary, strengths, weaknesses, recommendations, recommended_career_path, skills_to_improve, employability_recommendation, generated_at, created_at",
          )
          .eq("learner_id", learnerId)
          .eq("analysis_type", "employability")
          .eq("status", "completed")
          .order("generated_at", { ascending: false, nullsFirst: false })
          .limit(1)
          .maybeSingle(),
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
      analysisResult.error ??
      offersResult.error;

    if (queryError) {
      console.error("Failed to load learner profile data:", queryError.message);
      return { status: "error" };
    }

    const learner = learnerResult.data as LearnerRecord;
    const attendanceRecords = (attendanceResult.data ?? []) as AttendanceRecord[];
    const quizRecords = (quizResult.data ?? []) as QuizRecord[];
    const projectRecords = (projectResult.data ?? []) as ProjectRecord[];
    const skillRecords = (skillsResult.data ?? []) as SkillRecord[];
    const latestAnalysis = analysisResult.data as AnalysisRecord | null;
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
    const profile = firstRelation(learner.profiles);
    const program = firstRelation(learner.programs);
    const skills = skillRecords.map(
      (skill): LearnerSkillView => ({
        name: skill.name,
        category: skill.category,
        proficiencyLevel: Number(skill.proficiency_level),
      }),
    );

    return {
      status: "success",
      data: {
        learnerId: learner.id,
        fullName: profile?.full_name ?? "Unnamed learner",
        email: profile?.email ?? "No email available",
        learnerCode: learner.learner_code,
        programName: program?.name ?? "No program assigned",
        attendanceRate,
        quizAverage,
        projectScore,
        engagementScore,
        employabilityScore,
        risk: calculateDropoutRisk({ attendanceRate, quizAverage }),
        skills,
        analysis: latestAnalysis
          ? {
              score:
                latestAnalysis.employability_score === null
                  ? null
                  : Number(latestAnalysis.employability_score),
              summary: latestAnalysis.summary ?? "Analysis completed.",
              strengths: toStringList(latestAnalysis.strengths),
              weaknesses: toStringList(latestAnalysis.weaknesses),
              recommendations: toStringList(latestAnalysis.recommendations),
              recommendedCareerPath:
                latestAnalysis.recommended_career_path,
              skillsToImprove: toStringList(latestAnalysis.skills_to_improve),
              employabilityRecommendation:
                latestAnalysis.employability_recommendation,
              generatedLabel: formatAnalysisDate(
                latestAnalysis.generated_at ?? latestAnalysis.created_at,
              ),
            }
          : null,
        companyMatches: findTopCompanyMatches(
          skills.map((skill) => skill.name),
          offers,
        ),
      },
    };
  } catch (error) {
    console.error("Unexpected learner profile error:", error);
    return { status: "error" };
  }
}

function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">
        {description}
      </CardContent>
    </Card>
  );
}

export default async function LearnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;

  if (!UUID_PATTERN.test(id)) notFound();

  const result = await getLearnerPageData(id);

  if (result.status === "not-found") notFound();

  if (result.status === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <CardTitle>Learner profile unavailable</CardTitle>
            <CardDescription>
              We could not load this learner from Supabase. Check the server configuration and try again.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const { data } = result;

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-orange-600 hover:text-orange-700"
          >
            ← Back to dashboard
          </Link>
        </div>

        <LearnerProfile
          fullName={data.fullName}
          email={data.email}
          learnerCode={data.learnerCode}
          programName={data.programName}
          skills={data.skills}
        />

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Attendance"
            value={`${data.attendanceRate.toFixed(1)}%`}
            description="Present and late sessions"
          />
          <MetricCard
            label="Quiz average"
            value={`${data.quizAverage.toFixed(1)}%`}
            description="Normalized quiz performance"
          />
          <MetricCard
            label="Project score"
            value={`${data.projectScore.toFixed(1)}%`}
            description="Average reviewed project score"
          />
          <MetricCard
            label="Engagement score"
            value={`${data.engagementScore.toFixed(1)}%`}
            description="Attendance, quizzes, and projects"
          />
        </section>

        <Card>
          <CardContent className="grid gap-6 md:grid-cols-[2fr_1fr] md:items-center">
            <EmployabilityScore score={data.employabilityScore} />
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium">Dropout risk</p>
              <div className="mt-2">
                <RiskBadge level={data.risk.level} />
              </div>
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                {data.risk.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <AiAnalysisCard learnerId={data.learnerId} analysis={data.analysis} />

        <section>
          <h2 className="text-xl font-semibold">Top company matches</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Open opportunities ranked against the learner&apos;s current skills.
          </p>
          {data.companyMatches.length > 0 ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {data.companyMatches.map((match) => (
                <MatchingCard key={match.offerId} match={match} />
              ))}
            </div>
          ) : (
            <Card className="mt-4 border-dashed text-center">
              <CardContent className="text-sm text-muted-foreground">
                No open company offers are available for matching.
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </main>
  );
}
