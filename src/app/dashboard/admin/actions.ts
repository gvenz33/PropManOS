"use server";

import { ROLE_LABELS, type UserRole } from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") throw new Error("Admin access required.");
  return { supabase, user };
}

export async function updateSubscriberRole(profileId: string, role: UserRole) {
  if (!ROLE_LABELS[role]) return { error: "Invalid role." };

  const { supabase, user } = await requireAdmin();
  if (profileId === user.id && role !== "admin") {
    return { error: "You cannot remove your own admin access." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", profileId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/subscribers");
  return { ok: true };
}
