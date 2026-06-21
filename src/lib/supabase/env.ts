import "server-only";

export type SupabaseServerEnvironment = Readonly<{
  url: string;
  publishableKey: string;
}>;

export type SupabaseAdminEnvironment = Readonly<{
  url: string;
  adminKey: string;
}>;

function requireEnvironmentVariable(
  name: string,
  value: string | undefined,
): string {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and add your Supabase project value.`,
    );
  }

  return normalizedValue;
}

function requireSupabaseUrl(name: string, value: string | undefined): string {
  const url = requireEnvironmentVariable(name, value);

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== "https:" && parsedUrl.hostname !== "localhost") {
      throw new Error("Supabase URLs must use HTTPS outside local development.");
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Invalid URL";
    throw new Error(`${name} must be a valid Supabase URL. ${reason}`);
  }

  return url;
}

export function getSupabaseServerEnvironment(): SupabaseServerEnvironment {
  return {
    url: requireSupabaseUrl(
      "NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL,
    ),
    publishableKey: requireEnvironmentVariable(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or SUPABASE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.SUPABASE_PUBLISHABLE_KEY,
    ),
  };
}

export function getSupabaseAdminEnvironment(): SupabaseAdminEnvironment {
  const serverEnvironment = getSupabaseServerEnvironment();
  const adminKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

  const validatedAdminKey = requireEnvironmentVariable(
    "SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY",
    adminKey,
  );

  if (validatedAdminKey === serverEnvironment.publishableKey) {
    throw new Error(
      "The Supabase admin credential cannot be the publishable key.",
    );
  }

  return { url: serverEnvironment.url, adminKey: validatedAdminKey };
}
