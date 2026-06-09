import { PROP_MAN_STORAGE_BUCKET } from "@/lib/supabase/storage";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: doc, error } = await supabase
    .from("documents")
    .select("storage_path, filename")
    .eq("id", id)
    .maybeSingle();

  if (error || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(PROP_MAN_STORAGE_BUCKET)
    .createSignedUrl(doc.storage_path, 60);

  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: signError?.message ?? "Could not create download link" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
