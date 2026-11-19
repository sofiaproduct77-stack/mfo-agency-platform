import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase/server";
import { ROLE_HOME } from "@/types/database";

export default async function HomePage() {
  const profile = await getProfile();
  if (!profile) {
    redirect("/login");
  }
  redirect(ROLE_HOME[profile.role]);
}
