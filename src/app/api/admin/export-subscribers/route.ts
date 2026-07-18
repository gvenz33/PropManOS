import { ROLE_LABELS } from "@/lib/brand";
import { SUBSCRIPTION_PLANS, normalizeSubscriptionPlan, type SubscriptionPlan } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function csvEscape(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (adminProfile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, subscription_plan, created_at")
    .order("created_at", { ascending: false });

  const header = ["id", "full_name", "email", "phone", "role", "subscription_plan", "created_at"];
  const rows = (profiles ?? []).map((profile) =>
    [
      profile.id,
      profile.full_name ?? "",
      profile.email ?? "",
      profile.phone ?? "",
      ROLE_LABELS[profile.role as keyof typeof ROLE_LABELS] ?? profile.role,
      SUBSCRIPTION_PLANS[normalizeSubscriptionPlan(profile.subscription_plan)]?.label ??
        profile.subscription_plan,
      profile.created_at,
    ]
      .map((value) => csvEscape(String(value)))
      .join(","),
  );

  const csv = [header.join(","), ...rows].join("\n");
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="gotmyrent-subscribers-${date}.csv"`,
    },
  });
}
