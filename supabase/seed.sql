begin;

insert into public.profiles (id, full_name, email, role)
values
  ('10000000-0000-4000-8000-000000000001', 'Amina El Idrissi', 'admin@odcpulse.ma', 'admin'),
  ('10000000-0000-4000-8000-000000000101', 'Sara Benali', 'sara.benali@example.com', 'learner'),
  ('10000000-0000-4000-8000-000000000102', 'Youssef Alaoui', 'youssef.alaoui@example.com', 'learner'),
  ('10000000-0000-4000-8000-000000000103', 'Meryem Tazi', 'meryem.tazi@example.com', 'learner'),
  ('10000000-0000-4000-8000-000000000104', 'Omar Chraibi', 'omar.chraibi@example.com', 'learner'),
  ('10000000-0000-4000-8000-000000000105', 'Salma Naciri', 'salma.naciri@example.com', 'learner'),
  ('10000000-0000-4000-8000-000000000106', 'Mehdi Berrada', 'mehdi.berrada@example.com', 'learner')
on conflict (id) do update set
  full_name = excluded.full_name,
  email = excluded.email,
  role = excluded.role;

insert into public.programs (id, name, description, start_date, end_date, status)
values (
  '20000000-0000-4000-8000-000000000001',
  'Data & AI Bootcamp',
  'An intensive ODC program covering data analysis, machine learning, and employability skills.',
  '2026-05-04',
  '2026-07-31',
  'active'
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  status = excluded.status;

insert into public.learners
  (id, profile_id, program_id, learner_code, education_level, specialization, enrollment_status, joined_at)
values
  ('30000000-0000-4000-8000-000000000101', '10000000-0000-4000-8000-000000000101', '20000000-0000-4000-8000-000000000001', 'ODC-DAI-001', 'Bachelor', 'Computer Science', 'active', '2026-05-04'),
  ('30000000-0000-4000-8000-000000000102', '10000000-0000-4000-8000-000000000102', '20000000-0000-4000-8000-000000000001', 'ODC-DAI-002', 'Master', 'Data Science', 'active', '2026-05-04'),
  ('30000000-0000-4000-8000-000000000103', '10000000-0000-4000-8000-000000000103', '20000000-0000-4000-8000-000000000001', 'ODC-DAI-003', 'Bachelor', 'Applied Mathematics', 'active', '2026-05-04'),
  ('30000000-0000-4000-8000-000000000104', '10000000-0000-4000-8000-000000000104', '20000000-0000-4000-8000-000000000001', 'ODC-DAI-004', 'Technician Diploma', 'Software Development', 'active', '2026-05-04'),
  ('30000000-0000-4000-8000-000000000105', '10000000-0000-4000-8000-000000000105', '20000000-0000-4000-8000-000000000001', 'ODC-DAI-005', 'Master', 'Business Analytics', 'active', '2026-05-04'),
  ('30000000-0000-4000-8000-000000000106', '10000000-0000-4000-8000-000000000106', '20000000-0000-4000-8000-000000000001', 'ODC-DAI-006', 'Bachelor', 'Information Systems', 'active', '2026-05-04')
on conflict (id) do update set
  profile_id = excluded.profile_id,
  program_id = excluded.program_id,
  learner_code = excluded.learner_code,
  education_level = excluded.education_level,
  specialization = excluded.specialization,
  enrollment_status = excluded.enrollment_status,
  joined_at = excluded.joined_at;

insert into public.attendance_records (learner_id, attendance_date, status, check_in_time)
values
  ('30000000-0000-4000-8000-000000000101', '2026-06-08', 'present', '08:54'),
  ('30000000-0000-4000-8000-000000000101', '2026-06-09', 'present', '08:58'),
  ('30000000-0000-4000-8000-000000000101', '2026-06-10', 'late', '09:18'),
  ('30000000-0000-4000-8000-000000000101', '2026-06-11', 'present', '08:50'),
  ('30000000-0000-4000-8000-000000000101', '2026-06-12', 'present', '08:55'),
  ('30000000-0000-4000-8000-000000000102', '2026-06-08', 'present', '08:48'),
  ('30000000-0000-4000-8000-000000000102', '2026-06-09', 'present', '08:51'),
  ('30000000-0000-4000-8000-000000000102', '2026-06-10', 'present', '08:56'),
  ('30000000-0000-4000-8000-000000000102', '2026-06-11', 'present', '08:49'),
  ('30000000-0000-4000-8000-000000000102', '2026-06-12', 'present', '08:52'),
  ('30000000-0000-4000-8000-000000000103', '2026-06-08', 'present', '08:57'),
  ('30000000-0000-4000-8000-000000000103', '2026-06-09', 'absent', null),
  ('30000000-0000-4000-8000-000000000103', '2026-06-10', 'present', '08:59'),
  ('30000000-0000-4000-8000-000000000103', '2026-06-11', 'present', '08:53'),
  ('30000000-0000-4000-8000-000000000103', '2026-06-12', 'late', '09:12'),
  ('30000000-0000-4000-8000-000000000104', '2026-06-08', 'late', '09:14'),
  ('30000000-0000-4000-8000-000000000104', '2026-06-09', 'present', '08:55'),
  ('30000000-0000-4000-8000-000000000104', '2026-06-10', 'present', '08:47'),
  ('30000000-0000-4000-8000-000000000104', '2026-06-11', 'absent', null),
  ('30000000-0000-4000-8000-000000000104', '2026-06-12', 'present', '08:58'),
  ('30000000-0000-4000-8000-000000000105', '2026-06-08', 'present', '08:52'),
  ('30000000-0000-4000-8000-000000000105', '2026-06-09', 'present', '08:54'),
  ('30000000-0000-4000-8000-000000000105', '2026-06-10', 'excused', null),
  ('30000000-0000-4000-8000-000000000105', '2026-06-11', 'present', '08:50'),
  ('30000000-0000-4000-8000-000000000105', '2026-06-12', 'present', '08:49'),
  ('30000000-0000-4000-8000-000000000106', '2026-06-08', 'present', '08:59'),
  ('30000000-0000-4000-8000-000000000106', '2026-06-09', 'late', '09:09'),
  ('30000000-0000-4000-8000-000000000106', '2026-06-10', 'present', '08:55'),
  ('30000000-0000-4000-8000-000000000106', '2026-06-11', 'present', '08:57'),
  ('30000000-0000-4000-8000-000000000106', '2026-06-12', 'present', '08:53')
on conflict (learner_id, attendance_date) do update set
  status = excluded.status,
  check_in_time = excluded.check_in_time;

insert into public.quiz_results (learner_id, quiz_name, score, completed_at)
values
  ('30000000-0000-4000-8000-000000000101', 'Python Foundations', 88, '2026-05-22 14:00+01'),
  ('30000000-0000-4000-8000-000000000101', 'SQL & Data Modeling', 92, '2026-06-05 14:00+01'),
  ('30000000-0000-4000-8000-000000000102', 'Python Foundations', 95, '2026-05-22 14:00+01'),
  ('30000000-0000-4000-8000-000000000102', 'SQL & Data Modeling', 90, '2026-06-05 14:00+01'),
  ('30000000-0000-4000-8000-000000000103', 'Python Foundations', 79, '2026-05-22 14:00+01'),
  ('30000000-0000-4000-8000-000000000103', 'SQL & Data Modeling', 84, '2026-06-05 14:00+01'),
  ('30000000-0000-4000-8000-000000000104', 'Python Foundations', 73, '2026-05-22 14:00+01'),
  ('30000000-0000-4000-8000-000000000104', 'SQL & Data Modeling', 76, '2026-06-05 14:00+01'),
  ('30000000-0000-4000-8000-000000000105', 'Python Foundations', 86, '2026-05-22 14:00+01'),
  ('30000000-0000-4000-8000-000000000105', 'SQL & Data Modeling', 94, '2026-06-05 14:00+01'),
  ('30000000-0000-4000-8000-000000000106', 'Python Foundations', 81, '2026-05-22 14:00+01'),
  ('30000000-0000-4000-8000-000000000106', 'SQL & Data Modeling', 83, '2026-06-05 14:00+01')
on conflict (learner_id, quiz_name, attempt_number) do update set
  score = excluded.score,
  completed_at = excluded.completed_at;

insert into public.projects
  (learner_id, title, description, score, status, submitted_at, reviewed_at)
values
  ('30000000-0000-4000-8000-000000000101', 'Customer Churn Predictor', 'Classification model and dashboard for telecom churn risk.', 91, 'reviewed', '2026-06-14 18:10+01', '2026-06-16 11:00+01'),
  ('30000000-0000-4000-8000-000000000102', 'Job Offer Recommender', 'Skills-based recommendation engine for junior candidates.', 94, 'reviewed', '2026-06-14 17:40+01', '2026-06-16 11:20+01'),
  ('30000000-0000-4000-8000-000000000103', 'Training Impact Dashboard', 'Power BI dashboard for learner attendance and outcomes.', 85, 'reviewed', '2026-06-14 19:00+01', '2026-06-16 11:40+01'),
  ('30000000-0000-4000-8000-000000000104', 'Support Ticket Classifier', 'NLP prototype that routes customer support tickets.', 78, 'reviewed', '2026-06-14 20:15+01', '2026-06-16 12:00+01'),
  ('30000000-0000-4000-8000-000000000105', 'Retail Sales Forecaster', 'Time-series dashboard for weekly sales forecasts.', 89, 'reviewed', '2026-06-14 18:35+01', '2026-06-16 12:20+01'),
  ('30000000-0000-4000-8000-000000000106', 'CV Skill Extractor', 'AI-assisted extraction of structured skills from CVs.', 84, 'reviewed', '2026-06-14 19:25+01', '2026-06-16 12:40+01')
on conflict (learner_id, title) do update set
  description = excluded.description,
  score = excluded.score,
  status = excluded.status,
  submitted_at = excluded.submitted_at,
  reviewed_at = excluded.reviewed_at;

insert into public.skills (learner_id, name, category, proficiency_level, evidence)
values
  ('30000000-0000-4000-8000-000000000101', 'Python', 'technical', 4, 'Quiz and churn project'),
  ('30000000-0000-4000-8000-000000000101', 'SQL', 'technical', 4, 'SQL quiz'),
  ('30000000-0000-4000-8000-000000000101', 'Communication', 'soft', 4, 'Project presentation'),
  ('30000000-0000-4000-8000-000000000102', 'Python', 'technical', 5, 'Quiz and recommendation project'),
  ('30000000-0000-4000-8000-000000000102', 'Machine Learning', 'technical', 4, 'Offer recommender'),
  ('30000000-0000-4000-8000-000000000102', 'Problem Solving', 'soft', 5, 'Mentor assessment'),
  ('30000000-0000-4000-8000-000000000103', 'Power BI', 'technical', 4, 'Impact dashboard'),
  ('30000000-0000-4000-8000-000000000103', 'SQL', 'technical', 4, 'SQL quiz'),
  ('30000000-0000-4000-8000-000000000103', 'Data Storytelling', 'soft', 4, 'Project presentation'),
  ('30000000-0000-4000-8000-000000000104', 'Python', 'technical', 3, 'Support ticket project'),
  ('30000000-0000-4000-8000-000000000104', 'NLP', 'technical', 3, 'Ticket classifier'),
  ('30000000-0000-4000-8000-000000000104', 'Teamwork', 'soft', 4, 'Peer assessment'),
  ('30000000-0000-4000-8000-000000000105', 'Power BI', 'technical', 5, 'Sales dashboard'),
  ('30000000-0000-4000-8000-000000000105', 'SQL', 'technical', 5, 'SQL quiz'),
  ('30000000-0000-4000-8000-000000000105', 'Business Analysis', 'soft', 4, 'Forecasting project'),
  ('30000000-0000-4000-8000-000000000106', 'Python', 'technical', 4, 'CV extraction project'),
  ('30000000-0000-4000-8000-000000000106', 'NLP', 'technical', 4, 'CV skill extractor'),
  ('30000000-0000-4000-8000-000000000106', 'Communication', 'soft', 3, 'Project presentation')
on conflict (learner_id, name) do update set
  category = excluded.category,
  proficiency_level = excluded.proficiency_level,
  evidence = excluded.evidence;

insert into public.company_offers
  (id, company_name, title, description, location, employment_type, required_skills, application_url, status, published_at, closes_at)
values
  ('40000000-0000-4000-8000-000000000001', 'Orange Maroc', 'Junior Data Analyst', 'Support commercial teams with dashboards and customer insights.', 'Casablanca, Morocco', 'full_time', array['SQL', 'Power BI', 'Communication'], 'https://example.com/jobs/orange-data-analyst', 'open', '2026-06-10 09:00+01', '2026-07-10 23:59+01'),
  ('40000000-0000-4000-8000-000000000002', 'Atlas AI Labs', 'Machine Learning Intern', 'Build and evaluate applied machine-learning prototypes.', 'Rabat, Morocco', 'internship', array['Python', 'Machine Learning', 'Problem Solving'], 'https://example.com/jobs/atlas-ml-intern', 'open', '2026-06-12 09:00+01', '2026-07-05 23:59+01'),
  ('40000000-0000-4000-8000-000000000003', 'Northstar Consulting', 'BI Developer - Junior', 'Create decision dashboards and maintain analytics datasets.', 'Hybrid - Casablanca', 'full_time', array['Power BI', 'SQL', 'Data Storytelling'], 'https://example.com/jobs/northstar-bi-developer', 'open', '2026-06-15 09:00+01', '2026-07-15 23:59+01')
on conflict (id) do update set
  company_name = excluded.company_name,
  title = excluded.title,
  description = excluded.description,
  location = excluded.location,
  employment_type = excluded.employment_type,
  required_skills = excluded.required_skills,
  application_url = excluded.application_url,
  status = excluded.status,
  published_at = excluded.published_at,
  closes_at = excluded.closes_at;

insert into public.ai_analyses
  (learner_id, analysis_type, status, employability_score, summary, strengths, recommendations, matched_offer_ids, model_name, workflow_run_id, generated_at)
values
  ('30000000-0000-4000-8000-000000000101', 'employability', 'completed', 88, 'Strong data fundamentals and consistent delivery, ready for junior analyst roles.', '["Python", "SQL", "Project delivery"]', '["Add a Power BI portfolio sample", "Practice behavioral interviews"]', array['40000000-0000-4000-8000-000000000001']::uuid[], 'gpt-4.1-mini', 'demo-run-001', '2026-06-17 10:00+01'),
  ('30000000-0000-4000-8000-000000000102', 'employability', 'completed', 93, 'Excellent technical performance with strong machine-learning potential.', '["Python", "Machine Learning", "Problem solving"]', '["Document model evaluation decisions", "Improve production deployment skills"]', array['40000000-0000-4000-8000-000000000002']::uuid[], 'gpt-4.1-mini', 'demo-run-002', '2026-06-17 10:05+01'),
  ('30000000-0000-4000-8000-000000000103', 'employability', 'completed', 84, 'Good analytics profile with clear dashboard communication skills.', '["Power BI", "SQL", "Data storytelling"]', '["Strengthen Python automation", "Publish the dashboard case study"]', array['40000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000003']::uuid[], 'gpt-4.1-mini', 'demo-run-003', '2026-06-17 10:10+01'),
  ('30000000-0000-4000-8000-000000000104', 'employability', 'completed', 74, 'Promising software profile that needs deeper data and NLP fundamentals.', '["Teamwork", "Python basics", "Prototype delivery"]', '["Improve SQL fluency", "Add NLP evaluation metrics"]', array[]::uuid[], 'gpt-4.1-mini', 'demo-run-004', '2026-06-17 10:15+01'),
  ('30000000-0000-4000-8000-000000000105', 'employability', 'completed', 90, 'Job-ready BI profile combining business context and strong dashboard skills.', '["Power BI", "SQL", "Business analysis"]', '["Add data governance knowledge", "Practice technical interviews"]', array['40000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000003']::uuid[], 'gpt-4.1-mini', 'demo-run-005', '2026-06-17 10:20+01'),
  ('30000000-0000-4000-8000-000000000106', 'employability', 'completed', 82, 'Solid applied NLP profile with a relevant employability project.', '["Python", "NLP", "Product thinking"]', '["Improve presentation confidence", "Add automated tests to the project"]', array['40000000-0000-4000-8000-000000000002']::uuid[], 'gpt-4.1-mini', 'demo-run-006', '2026-06-17 10:25+01')
on conflict (learner_id, analysis_type) do update set
  status = excluded.status,
  employability_score = excluded.employability_score,
  summary = excluded.summary,
  strengths = excluded.strengths,
  recommendations = excluded.recommendations,
  matched_offer_ids = excluded.matched_offer_ids,
  model_name = excluded.model_name,
  workflow_run_id = excluded.workflow_run_id,
  generated_at = excluded.generated_at;

commit;
