alter table public.ai_analyses
  add column if not exists weaknesses jsonb not null default '[]'::jsonb,
  add column if not exists recommended_career_path text,
  add column if not exists skills_to_improve jsonb not null default '[]'::jsonb,
  add column if not exists employability_recommendation text;
