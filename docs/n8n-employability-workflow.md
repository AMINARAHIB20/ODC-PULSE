# n8n Employability Workflow

This workflow receives a deterministic learner snapshot from Next.js, asks OpenAI for narrative guidance, persists the result in Supabase, and responds synchronously to the learner page.

## Credentials

Create these credentials inside n8n. Do not place their values in the workflow JSON or the Next.js client.

1. **Webhook Header Auth**
   - Header name: `X-ODC-Webhook-Secret`
   - Header value: the same value as `N8N_WEBHOOK_SECRET`
2. **OpenAI credential**
   - Store the OpenAI API key in n8n Credentials.
3. **Supabase credential**
   - Project URL: the ODC Pulse Supabase URL.
   - Secret/service-role key: store only in n8n Credentials.

## Workflow nodes

### 1. Webhook

- Method: `POST`
- Path: `odc-employability`
- Authentication: the Header Auth credential above
- Response mode: **Using Respond to Webhook node**
- Use the production `/webhook/odc-employability` URL after activating the workflow.

The request body contains:

```json
{
  "version": "1.0",
  "requestedAt": "ISO timestamp",
  "learner": {
    "id": "uuid",
    "code": "ODC-DAI-001",
    "fullName": "Learner name",
    "email": "learner@example.com",
    "programName": "Data & AI Bootcamp"
  },
  "metrics": {
    "attendanceRate": 90,
    "quizAverage": 85,
    "projectScore": 88,
    "technicalSkillsAverage": 80,
    "engagementScore": 87,
    "employabilityScore": 83,
    "dropoutRisk": "low"
  },
  "skills": [],
  "companyMatches": []
}
```

### 2. OpenAI

Use a low-cost chat model with structured JSON output. The score and offer matching are deterministic and must not be recalculated by the model.

System prompt:

```text
You are an employability coach for Orange Digital Center.
Use only the supplied learner data.
Do not change the supplied employability score, dropout risk, or company matches.
Write concise, practical feedback suitable for a junior candidate.
Return valid JSON only.
```

Required output:

```json
{
  "summary": "Maximum two sentences.",
  "strengths": ["Exactly three concise strengths"],
  "recommendations": ["Exactly three actionable recommendations"]
}
```

Pass the complete webhook body as the user message.

### 3. Prepare Supabase row

Use an Edit Fields/Set node to create this object:

```json
{
  "learner_id": "={{ $('Webhook').item.json.body.learner.id }}",
  "analysis_type": "employability",
  "status": "completed",
  "employability_score": "={{ $('Webhook').item.json.body.metrics.employabilityScore }}",
  "summary": "={{ $json.summary }}",
  "strengths": "={{ $json.strengths }}",
  "recommendations": "={{ $json.recommendations }}",
  "matched_offer_ids": "={{ $('Webhook').item.json.body.companyMatches.map(item => item.offerId) }}",
  "model_name": "the configured OpenAI model",
  "workflow_run_id": "={{ $execution.id }}",
  "generated_at": "={{ $now.toISO() }}"
}
```

### 4. Supabase upsert

Upsert into `public.ai_analyses` using the existing unique key:

```text
learner_id, analysis_type
```

The workflow must wait for the Supabase operation to succeed before responding.

### 5. Respond to Webhook

- Status: `200`
- JSON body:

```json
{
  "success": true,
  "learnerId": "={{ $('Webhook').item.json.body.learner.id }}",
  "analysisId": "={{ $json.id }}"
}
```

## Error handling

Add a workflow error branch or Error Trigger workflow that logs the execution. The main webhook must return a non-2xx response when OpenAI output validation or Supabase persistence fails. Never return API keys, credentials, or raw internal errors.

## Final configuration

1. Activate the n8n workflow.
2. Copy its production webhook URL into `N8N_IMPACT_WEBHOOK_URL`.
3. Set the same long random value in n8n Header Auth and `N8N_WEBHOOK_SECRET`.
4. Restart the Next.js server after changing `.env.local`.
5. Open a learner profile and click **Generate AI Employability Analysis**.
