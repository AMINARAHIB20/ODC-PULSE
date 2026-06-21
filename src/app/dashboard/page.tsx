import { connection } from "next/server";

import { ImpactChart, type ImpactChartPoint } from "@/components/dashboard/ImpactChart";
import { KpiCard } from "@/components/dashboard/KpiCard";
import {
  LearnerRiskTable,
  type LearnerRiskRow,
  type LearnerRiskStatus,
} from "@/components/dashboard/LearnerRiskTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface LearnerRecord {
  id: string;
  learner_code: string;
  profiles: { full_name: string } | { full_name: string }[] | null;
}

interface AttendanceRecord {
  learner_id: string;
  status: "present" | "absent" | "late" | "excused";
}

interface QuizRecord {
  learner_id: string;
  score: number;
  max_score: number;
}

interface AnalysisRecord {
  learner_id: string;
  employability_score: number | null;
}

interface DashboardData {
  learners: LearnerRiskRow[];
  chartData: ImpactChartPoint[];
  averageAttendanceRate: number;
  averageQuizScore: number;
  averageEmployabilityScore: number;
  highRiskLearners: number;
  internshipReadyLearners: number;
}

type DashboardResult =
  | { status: "success"; data: DashboardData }
  | { status: "error" };

function average(values: number[]): number {
  if (values.length === 0) return 0;

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function roundMetric(value: number): number {
  return Math.round(value * 10) / 10;
}

function getLearnerName(profile: LearnerRecord["profiles"]): string {
  if (Array.isArray(profile)) {
    return profile[0]?.full_name ?? "Unnamed learner";
  }

  return profile?.full_name ?? "Unnamed learner";
}

function getRiskStatus(
  attendanceRate: number,
  quizScore: number,
  employabilityScore: number,
): LearnerRiskStatus {
  if (attendanceRate < 70 || quizScore < 60 || employabilityScore < 60) {
    return "high";
  }

  if (attendanceRate < 85 || quizScore < 75 || employabilityScore < 75) {
    return "medium";
  }

  return "low";
}

async function getDashboardData(): Promise<DashboardResult> {
  try {
    const supabase = createSupabaseAdminClient();
    const [learnersResult, attendanceResult, quizzesResult, analysesResult] =
      await Promise.all([
        supabase
          .from("learners")
          .select("id, learner_code, profiles(full_name)")
          .order("learner_code"),
        supabase
          .from("attendance_records")
          .select("learner_id, status"),
        supabase
          .from("quiz_results")
          .select("learner_id, score, max_score"),
        supabase
          .from("ai_analyses")
          .select("learner_id, employability_score")
          .eq("analysis_type", "employability")
          .eq("status", "completed"),
      ]);

    const queryError =
      learnersResult.error ??
      attendanceResult.error ??
      quizzesResult.error ??
      analysesResult.error;

    if (queryError) {
      console.error("Failed to load dashboard data:", queryError.message);
      return { status: "error" };
    }

    const learnerRecords = (learnersResult.data ?? []) as LearnerRecord[];
    const attendanceRecords = (attendanceResult.data ?? []) as AttendanceRecord[];
    const quizRecords = (quizzesResult.data ?? []) as QuizRecord[];
    const analysisRecords = (analysesResult.data ?? []) as AnalysisRecord[];

    const learners = learnerRecords.map((learner): LearnerRiskRow => {
      const learnerAttendance = attendanceRecords.filter(
        (record) => record.learner_id === learner.id && record.status !== "excused",
      );
      const attendedSessions = learnerAttendance.filter(
        (record) => record.status === "present" || record.status === "late",
      ).length;
      const attendanceRate = learnerAttendance.length
        ? (attendedSessions / learnerAttendance.length) * 100
        : 0;

      const learnerQuizzes = quizRecords.filter(
        (record) => record.learner_id === learner.id,
      );
      const quizScore = average(
        learnerQuizzes.map((record) =>
          record.max_score > 0 ? (Number(record.score) / Number(record.max_score)) * 100 : 0,
        ),
      );

      const employabilityScore = Number(
        analysisRecords.find((record) => record.learner_id === learner.id)
          ?.employability_score ?? 0,
      );
      const roundedAttendance = roundMetric(attendanceRate);
      const roundedQuiz = roundMetric(quizScore);
      const roundedEmployability = roundMetric(employabilityScore);

      return {
        id: learner.id,
        learnerCode: learner.learner_code,
        name: getLearnerName(learner.profiles),
        attendanceRate: roundedAttendance,
        quizScore: roundedQuiz,
        employabilityScore: roundedEmployability,
        riskStatus: getRiskStatus(
          roundedAttendance,
          roundedQuiz,
          roundedEmployability,
        ),
        readyForInternship:
          roundedAttendance >= 80 &&
          roundedQuiz >= 75 &&
          roundedEmployability >= 80,
      };
    });

    return {
      status: "success",
      data: {
        learners,
        chartData: learners.map((learner) => ({
          name: learner.name.split(" ")[0],
          attendance: learner.attendanceRate,
          quiz: learner.quizScore,
          employability: learner.employabilityScore,
        })),
        averageAttendanceRate: roundMetric(
          average(learners.map((learner) => learner.attendanceRate)),
        ),
        averageQuizScore: roundMetric(
          average(learners.map((learner) => learner.quizScore)),
        ),
        averageEmployabilityScore: roundMetric(
          average(learners.map((learner) => learner.employabilityScore)),
        ),
        highRiskLearners: learners.filter(
          (learner) => learner.riskStatus === "high",
        ).length,
        internshipReadyLearners: learners.filter(
          (learner) => learner.readyForInternship,
        ).length,
      },
    };
  } catch (error) {
    console.error("Unexpected dashboard error:", error);
    return { status: "error" };
  }
}

function DashboardMessage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}

export default async function DashboardPage() {
  await connection();
  const result = await getDashboardData();

  if (result.status === "error") {
    return (
      <DashboardMessage
        title="Dashboard unavailable"
        description="We could not load the Supabase data. Check the server environment and try again."
      />
    );
  }

  if (result.data.learners.length === 0) {
    return (
      <DashboardMessage
        title="No learner data yet"
        description="Add learners and their training results in Supabase to populate the impact dashboard."
      />
    );
  }

  const { data } = result;

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <header>
          <p className="text-sm font-medium text-orange-600">Orange Digital Center</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Impact Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Live employability, participation, and learning outcomes for the Data &amp; AI Bootcamp.
          </p>
        </header>

        <section
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          aria-label="Program key performance indicators"
        >
          <KpiCard
            label="Total learners"
            value={data.learners.length}
            description="Active learner profiles"
          />
          <KpiCard
            label="Average attendance"
            value={`${data.averageAttendanceRate.toFixed(1)}%`}
            description="Present and late sessions"
          />
          <KpiCard
            label="Average quiz score"
            value={`${data.averageQuizScore.toFixed(1)}%`}
            description="Normalized across all quizzes"
          />
          <KpiCard
            label="Employability score"
            value={data.averageEmployabilityScore.toFixed(1)}
            description="Average completed AI analysis"
          />
          <KpiCard
            label="High-risk learners"
            value={data.highRiskLearners}
            description="Requires immediate follow-up"
          />
          <KpiCard
            label="Internship ready"
            value={data.internshipReadyLearners}
            description="Meets demo readiness thresholds"
          />
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Learner impact overview</CardTitle>
            <CardDescription>
              Attendance, quiz performance, and AI employability score by learner.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImpactChart data={data.chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Learner risk tracking</CardTitle>
            <CardDescription>
              Demo indicators for follow-up and internship readiness.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LearnerRiskTable learners={data.learners} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
