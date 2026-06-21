# ODC Pulse

ODC Pulse is a demo-ready MVP for Orange Digital Center focused on AI employability intelligence, learner tracking, and impact reporting.

## Stack

- Next.js App Router and TypeScript
- Tailwind CSS and shadcn/ui
- Supabase PostgreSQL with Row Level Security
- OpenAI API
- n8n webhooks
- Power BI-compatible data export

## Local setup

Install dependencies:

```bash
npm install
```

Copy `.env.example` to `.env.local` and provide the Supabase values. Never commit `.env.local`.

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database

Apply the SQL files to Supabase in this order:

1. `supabase/schema.sql`
2. `supabase/rls.sql`
3. `supabase/seed.sql`

The demo seed includes one admin, six learners, one Data & AI Bootcamp, attendance, quiz and project results, skills, company offers, and AI employability analyses.

## Validation

```bash
npm run lint
npm run build
```
