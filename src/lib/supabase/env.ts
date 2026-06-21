import "server-only";

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and add your Supabase project value.`,
    );
  }

  return value;
}

export function getSupabaseEnvironment() {
  return {
    url: requireEnvironmentVariable("SUPABASE_URL"),
    publishableKey: requireEnvironmentVariable("SUPABASE_PUBLISHABLE_KEY"),
  };
}
