import "server-only";

export interface N8nEnvironment {
  webhookUrl: string;
  webhookSecret: string;
}

function requireEnvironmentVariable(
  name: string,
  value: string | undefined,
): string {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    throw new Error(
      `Missing ${name}. Add it to .env.local before using the AI workflow.`,
    );
  }

  return normalizedValue;
}

export function getN8nEnvironment(): N8nEnvironment {
  const webhookUrl = requireEnvironmentVariable(
    "N8N_IMPACT_WEBHOOK_URL",
    process.env.N8N_IMPACT_WEBHOOK_URL,
  );
  const webhookSecret = requireEnvironmentVariable(
    "N8N_WEBHOOK_SECRET",
    process.env.N8N_WEBHOOK_SECRET,
  );

  try {
    const parsedUrl = new URL(webhookUrl);
    const isLocal = ["localhost", "127.0.0.1"].includes(parsedUrl.hostname);

    if (parsedUrl.protocol !== "https:" && !isLocal) {
      throw new Error("n8n webhook URLs must use HTTPS outside local testing.");
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Invalid URL";
    throw new Error(`N8N_IMPACT_WEBHOOK_URL is invalid. ${reason}`);
  }

  if (webhookSecret.length < 16) {
    throw new Error("N8N_WEBHOOK_SECRET must contain at least 16 characters.");
  }

  return { webhookUrl, webhookSecret };
}
