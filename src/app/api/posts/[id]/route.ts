import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select("id,title,body,summary,image_url,created_at,author_id,author:users!posts_author_id_fkey(name)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(_request: Request, context: Context) {
  const { id } = await context.params;
  const supabase = await createClient();
  const payload = await _request.json().catch(() => ({}));

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 401 });
  }

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id,author_id")
    .eq("id", id)
    .maybeSingle();

  if (postError) {
    return NextResponse.json({ error: postError.message }, { status: 500 });
  }

  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: userRow } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
  const isAdmin = userRow?.role === "admin";
  const isAuthor = post.author_id === user.id;

  if (!isAdmin && !isAuthor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const update: Record<string, unknown> = {};
  if (typeof payload?.title === "string") update.title = payload.title;
  if (typeof payload?.body === "string") update.body = payload.body;
  if (typeof payload?.summary === "string") update.summary = payload.summary;
  if (payload?.image_url === null || typeof payload?.image_url === "string") update.image_url = payload.image_url;

  const { data, error } = await supabase.from("posts").update(update).eq("id", id).select("id").single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params;
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 401 });
  }

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id,author_id")
    .eq("id", id)
    .maybeSingle();

  if (postError) {
    return NextResponse.json({ error: postError.message }, { status: 500 });
  }

  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: userRow } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
  const isAdmin = userRow?.role === "admin";
  const isAuthor = post.author_id === user.id;

  if (!isAdmin && !isAuthor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.from("posts").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
