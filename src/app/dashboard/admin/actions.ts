"use server";

import { sendPasswordResetEmail } from "@/lib/auth/password-reset-email";
import { ROLE_LABELS, type UserRole } from "@/lib/brand";
import {
  featureFlagsFromForm,
  isSubscriptionPlan,
  type SubscriptionPlan,
} from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

function subscriberPath(profileId: string, query?: string) {
  return `/dashboard/admin/subscribers/${profileId}${query ? `?${query}` : ""}`;
}

function subscribersPath(query?: string) {
  return `/dashboard/admin/subscribers${query ? `?${query}` : ""}`;
}

async function getSubscriberEmail(profileId: string) {
  const { supabase } = await requireAdmin();
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", profileId)
    .maybeSingle();
  return profile;
}

export async function updateSubscriberRole(profileId: string, role: UserRole) {
  if (!ROLE_LABELS[role]) return { error: "Invalid role." };

  const { supabase, user } = await requireAdmin();
  if (profileId === user.id && role !== "admin") {
    return { error: "You cannot remove your own admin access." };
  }

  const { error } = await supabase.from("profiles").update({ role }).eq("id", profileId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/subscribers");
  revalidatePath(subscriberPath(profileId));
  return { ok: true };
}

export async function createSubscriber(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "tenant") as UserRole;
  const phone = String(formData.get("phone") ?? "").trim();
  const plan = String(formData.get("subscription_plan") ?? "essential");
  const password = String(formData.get("password") ?? "");
  const sendInvite = formData.get("send_invite") === "on";

  if (!email) {
    redirect(subscribersPath(`error=${encodeURIComponent("Email is required.")}`));
  }
  if (!ROLE_LABELS[role]) {
    redirect(subscribersPath(`error=${encodeURIComponent("Choose a valid role.")}`));
  }
  if (!isSubscriptionPlan(plan)) {
    redirect(subscribersPath(`error=${encodeURIComponent("Choose a valid subscription plan.")}`));
  }
  if (!sendInvite && password.length < 8) {
    redirect(
      subscribersPath(
        `error=${encodeURIComponent("Set a temporary password (8+ characters) or choose to email an invite link.")}`,
      ),
    );
  }

  const service = createServiceClient();
  if (!service) {
    redirect(
      subscribersPath(
        `error=${encodeURIComponent("Account creation is temporarily unavailable.")}`,
      ),
    );
  }

  const initialPassword = sendInvite
    ? crypto.randomUUID() + crypto.randomUUID()
    : password;

  const { data, error } = await service.auth.admin.createUser({
    email,
    password: initialPassword,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: role === "admin" ? "tenant" : role,
    },
  });

  if (error || !data.user) {
    redirect(
      subscribersPath(`error=${encodeURIComponent(error?.message ?? "Could not create account.")}`),
    );
  }

  const { supabase } = await requireAdmin();
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      role,
      full_name: fullName || null,
      phone: phone || null,
      email,
      subscription_plan: plan,
      subscription_status: "active",
      billing_exempt: true,
    })
    .eq("id", data.user.id);

  if (profileError) {
    await service.auth.admin.deleteUser(data.user.id);
    redirect(subscribersPath(`error=${encodeURIComponent(profileError.message)}`));
  }

  if (sendInvite) {
    const invite = await sendPasswordResetEmail(email);
    if (!invite.ok) {
      redirect(
        subscriberPath(
          data.user.id,
          `error=${encodeURIComponent(invite.error ?? "Account created but invite email failed to send.")}`,
        ),
      );
    }
  }

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/subscribers");
  redirect(
    subscriberPath(
      data.user.id,
      sendInvite ? "success=account-created-invited" : "success=account-created",
    ),
  );
}

export async function updateSubscriberProfile(formData: FormData): Promise<void> {
  const profileId = String(formData.get("profile_id") ?? "");
  if (!profileId) redirect("/dashboard/admin/subscribers");

  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName || null,
      phone: phone || null,
      email: email || null,
    })
    .eq("id", profileId);

  if (error) {
    redirect(subscriberPath(profileId, `error=${encodeURIComponent(error.message)}`));
  }

  if (email) {
    const service = createServiceClient();
    if (service) {
      await service.auth.admin.updateUserById(profileId, { email });
    }
  }

  revalidatePath("/dashboard/admin/subscribers");
  revalidatePath(subscriberPath(profileId));
  redirect(subscriberPath(profileId, "success=profile-updated"));
}

export async function updateSubscriberPlan(formData: FormData): Promise<void> {
  const profileId = String(formData.get("profile_id") ?? "");
  const plan = String(formData.get("subscription_plan") ?? "");
  if (!profileId || !isSubscriptionPlan(plan)) {
    redirect("/dashboard/admin/subscribers");
  }

  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("profiles")
    .update({
      subscription_plan: plan,
      subscription_status: "active",
      billing_exempt: true,
    })
    .eq("id", profileId);

  if (error) {
    redirect(subscriberPath(profileId, `error=${encodeURIComponent(error.message)}`));
  }

  revalidatePath(subscriberPath(profileId));
  redirect(subscriberPath(profileId, "success=plan-updated"));
}

export async function updateSubscriberFeatures(formData: FormData): Promise<void> {
  const profileId = String(formData.get("profile_id") ?? "");
  if (!profileId) redirect("/dashboard/admin/subscribers");

  const plan = String(formData.get("subscription_plan") ?? "essential");
  if (!profileId || !isSubscriptionPlan(plan)) {
    redirect("/dashboard/admin/subscribers");
  }

  const flags = featureFlagsFromForm(formData, plan);
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("profiles")
    .update({ feature_flags: flags })
    .eq("id", profileId);

  if (error) {
    redirect(subscriberPath(profileId, `error=${encodeURIComponent(error.message)}`));
  }

  revalidatePath(subscriberPath(profileId));
  redirect(subscriberPath(profileId, "success=features-updated"));
}

export async function sendSubscriberPasswordReset(formData: FormData): Promise<void> {
  const profileId = String(formData.get("profile_id") ?? "");
  if (!profileId) redirect("/dashboard/admin/subscribers");

  const profile = await getSubscriberEmail(profileId);
  if (!profile?.email) {
    redirect(
      subscriberPath(profileId, `error=${encodeURIComponent("This account has no email on file.")}`),
    );
  }

  const result = await sendPasswordResetEmail(profile.email);
  if (!result.ok) {
    redirect(
      subscriberPath(
        profileId,
        `error=${encodeURIComponent(result.error ?? "Could not send reset email.")}`,
      ),
    );
  }

  redirect(subscriberPath(profileId, "success=reset-sent"));
}

export async function setSubscriberTemporaryPassword(formData: FormData): Promise<void> {
  const profileId = String(formData.get("profile_id") ?? "");
  const password = String(formData.get("temporary_password") ?? "");
  if (!profileId) redirect("/dashboard/admin/subscribers");

  if (password.length < 8) {
    redirect(
      subscriberPath(
        profileId,
        `error=${encodeURIComponent("Temporary password must be at least 8 characters.")}`,
      ),
    );
  }

  const { user } = await requireAdmin();
  if (profileId === user.id) {
    redirect(
      subscriberPath(
        profileId,
        `error=${encodeURIComponent("Set your own password from Account settings instead.")}`,
      ),
    );
  }

  const service = createServiceClient();
  if (!service) {
    redirect(
      subscriberPath(
        profileId,
        `error=${encodeURIComponent("Password reset is temporarily unavailable.")}`,
      ),
    );
  }

  const { error } = await service.auth.admin.updateUserById(profileId, { password });
  if (error) {
    redirect(subscriberPath(profileId, `error=${encodeURIComponent(error.message)}`));
  }

  redirect(subscriberPath(profileId, "success=temp-password-set"));
}

export async function deleteSubscriber(formData: FormData): Promise<void> {
  const profileId = String(formData.get("profile_id") ?? "");
  const confirm = String(formData.get("confirm_email") ?? "").trim().toLowerCase();
  if (!profileId) redirect("/dashboard/admin/subscribers");

  const { user } = await requireAdmin();
  if (profileId === user.id) {
    redirect(
      subscriberPath(profileId, `error=${encodeURIComponent("You cannot delete your own account.")}`),
    );
  }

  const profile = await getSubscriberEmail(profileId);
  if (!profile?.email || confirm !== profile.email.toLowerCase()) {
    redirect(
      subscriberPath(
        profileId,
        `error=${encodeURIComponent("Type the account email exactly to confirm deletion.")}`,
      ),
    );
  }

  const service = createServiceClient();
  if (!service) {
    redirect(
      subscriberPath(
        profileId,
        `error=${encodeURIComponent("Account deletion is temporarily unavailable.")}`,
      ),
    );
  }

  const { error } = await service.auth.admin.deleteUser(profileId);
  if (error) {
    redirect(subscriberPath(profileId, `error=${encodeURIComponent(error.message)}`));
  }

  revalidatePath("/dashboard/admin/subscribers");
  redirect(subscribersPath("success=account-deleted"));
}
