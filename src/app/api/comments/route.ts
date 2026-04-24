import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const postId = url.searchParams.get("post_id");

  if (!postId) {
    return NextResponse.json({ error: "Missing post_id" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comments")
    .select("id,comment_text,created_at,user:users!comments_user_id_fkey(name)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const payload = await request.json().catch(() => ({}));
  const postId = typeof payload?.post_id === "string" ? payload.post_id : "";
  const commentText = typeof payload?.comment_text === "string" ? payload.comment_text : "";

  if (!postId || !commentText.trim()) {
    return NextResponse.json({ error: "Missing post_id or comment_text" }, { status: 400 });
  }

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

  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: postId, user_id: user.id, comment_text: commentText })
    .select("id,comment_text,created_at,user:users!comments_user_id_fkey(name)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
