begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  email text not null,
  role text not null default 'learner' check (role in ('admin', 'learner')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_email_lower_idx
  on public.profiles (lower(email));

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  start_date date not null,
  end_date date not null,
  status text not null default 'active' check (status in ('planned', 'active', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table if not exists public.learners (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete restrict,
  learner_code text not null unique,
  education_level text,
  specialization text,
  enrollment_status text not null default 'active'
    check (enrollment_status in ('active', 'completed', 'withdrawn')),
  joined_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists learners_program_id_idx on public.learners(program_id);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners(id) on delete cascade,
  attendance_date date not null,
  status text not null check (status in ('present', 'absent', 'late', 'excused')),
  check_in_time time,
  notes text,
  created_at timestamptz not null default now(),
  unique (learner_id, attendance_date)
);

create index if not exists attendance_records_date_idx
  on public.attendance_records(attendance_date);

create table if not exists public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners(id) on delete cascade,
  quiz_name text not null,
  score numeric(5,2) not null check (score between 0 and 100),
  max_score numeric(5,2) not null default 100 check (max_score > 0),
  attempt_number integer not null default 1 check (attempt_number > 0),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (learner_id, quiz_name, attempt_number)
);

create index if not exists quiz_results_learner_id_idx on public.quiz_results(learner_id);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners(id) on delete cascade,
  title text not null,
  description text,
  repository_url text,
  demo_url text,
  score numeric(5,2) check (score between 0 and 100),
  status text not null default 'submitted'
    check (status in ('draft', 'submitted', 'reviewed')),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (learner_id, title)
);

create index if not exists projects_learner_id_idx on public.projects(learner_id);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners(id) on delete cascade,
  name text not null,
  category text not null check (category in ('technical', 'soft', 'language')),
  proficiency_level integer not null check (proficiency_level between 1 and 5),
  evidence text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (learner_id, name)
);

create index if not exists skills_name_idx on public.skills(name);

create table if not exists public.company_offers (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  title text not null,
  description text,
  location text,
  employment_type text not null
    check (employment_type in ('internship', 'full_time', 'part_time', 'freelance')),
  required_skills text[] not null default '{}',
  application_url text,
  status text not null default 'open' check (status in ('draft', 'open', 'closed')),
  published_at timestamptz,
  closes_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_name, title)
);

create table if not exists public.ai_analyses (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners(id) on delete cascade,
  analysis_type text not null default 'employability'
    check (analysis_type in ('employability', 'skill_gap', 'offer_match')),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed')),
  employability_score numeric(5,2) check (employability_score between 0 and 100),
  summary text,
  strengths jsonb not null default '[]'::jsonb,
  weaknesses jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  recommended_career_path text,
  skills_to_improve jsonb not null default '[]'::jsonb,
  employability_recommendation text,
  matched_offer_ids uuid[] not null default '{}',
  model_name text,
  workflow_run_id text,
  error_message text,
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (learner_id, analysis_type)
);

create index if not exists ai_analyses_score_idx
  on public.ai_analyses(employability_score desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists programs_set_updated_at on public.programs;
create trigger programs_set_updated_at before update on public.programs
for each row execute function public.set_updated_at();

drop trigger if exists learners_set_updated_at on public.learners;
create trigger learners_set_updated_at before update on public.learners
for each row execute function public.set_updated_at();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists skills_set_updated_at on public.skills;
create trigger skills_set_updated_at before update on public.skills
for each row execute function public.set_updated_at();

drop trigger if exists company_offers_set_updated_at on public.company_offers;
create trigger company_offers_set_updated_at before update on public.company_offers
for each row execute function public.set_updated_at();

drop trigger if exists ai_analyses_set_updated_at on public.ai_analyses;
create trigger ai_analyses_set_updated_at before update on public.ai_analyses
for each row execute function public.set_updated_at();

commit;
