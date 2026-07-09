import { ActionMessage } from "@/components/action-message";
import { ROLE_LABELS, type UserRole } from "@/lib/brand";
import {
  effectiveFeatures,
  MANAGEABLE_FEATURES,
  parseFeatureFlags,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
} from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SubscriberRoleSelect } from "../role-select";
import { UserManagementForms } from "./user-management";

export default async function AdminSubscriberPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { id } = await params;
  const { success, error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (adminProfile?.role !== "admin") redirect("/dashboard");

  const { data: subscriber } = await supabase
    .from("profiles")
    .select(
      "id, full_name, role, email, phone, created_at, subscription_plan, feature_flags",
    )
    .eq("id", id)
    .maybeSingle();

  if (!subscriber) notFound();

  const plan = (subscriber.subscription_plan ?? "free") as SubscriptionPlan;
  const overrides = parseFeatureFlags(subscriber.feature_flags);
  const features = effectiveFeatures(plan, overrides);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/admin/subscribers"
            className="text-sm text-[var(--accent)] hover:underline"
          >
            ← Back to subscribers
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            {subscriber.full_name || subscriber.email || "Account"}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {ROLE_LABELS[subscriber.role as UserRole]} · Joined{" "}
            {new Date(subscriber.created_at).toLocaleDateString()}
          </p>
        </div>
        <SubscriberRoleSelect
          profileId={subscriber.id}
          currentRole={subscriber.role as UserRole}
          disabled={subscriber.id === user.id}
        />
      </div>

      <ActionMessage success={success} error={error} />

      <UserManagementForms
        profileId={subscriber.id}
        fullName={subscriber.full_name ?? ""}
        email={subscriber.email ?? ""}
        phone={subscriber.phone ?? ""}
        plan={plan}
        overrides={overrides}
        effectiveFeatures={features}
        isSelf={subscriber.id === user.id}
      />
    </div>
  );
}
