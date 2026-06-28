export function isAuthConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function getAuthRedirectUrl(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/auth/callback`;
}

export function getUserDisplayName(
  metadata: Record<string, unknown> | undefined,
  email?: string | null
): string {
  const name =
    (typeof metadata?.full_name === "string" && metadata.full_name) ||
    (typeof metadata?.name === "string" && metadata.name) ||
    (typeof metadata?.user_name === "string" && metadata.user_name) ||
    (typeof metadata?.nickname === "string" && metadata.nickname);

  if (name) return name;
  if (email) return email.split("@")[0] ?? "회원";
  return "회원";
}
