import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Profile } from "@/types/database";
import { ROLE_HOME } from "@/types/database";
import { redirect } from "next/navigation";
import { supabaseCookieDefaults } from "@/lib/supabase/cookie-options";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: supabaseCookieDefaults,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: {
          name: string;
          value: string;
          options: CookieOptions;
        }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...supabaseCookieDefaults,
                ...options,
              }),
            );
          } catch {
            /* set from Server Component */
          }
        },
      },
    },
  );
}

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const user = await getSessionUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data || !data.is_active) return null;
  return data as Profile;
}

export async function requireProfile() {
  const profile = await getProfile();
  if (!profile) {
    redirect("/login");
  }
  return profile;
}

export async function requireRole(allowed: Profile["role"][]) {
  const profile = await requireProfile();
  if (!allowed.includes(profile.role)) {
    redirect(ROLE_HOME[profile.role]);
  }
  return profile;
}

export async function signOutAction() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
