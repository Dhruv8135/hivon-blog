import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import CommentForm from "@/components/forms/CommentForm";
import DeletePostButton from "@/components/forms/DeletePostButton";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

type PostRow = {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  summary: string | null;
  author_id: string;
  created_at: string;
  author: { name: string | null } | null;
};

type CommentRow = {
  id: string;
  comment_text: string;
  created_at: string;
  user: { name: string | null } | null;
};

export default async function PostDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id,title,body,image_url,summary,author_id,created_at,author:users!posts_author_id_fkey(name)")
    .eq("id", id)
    .maybeSingle();

  if (postError) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {postError.message}
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Post not found</h1>
      </div>
    );
  }

  const row = post as unknown as PostRow;

  const { data: comments } = await supabase
    .from("comments")
    .select("id,comment_text,created_at,user:users!comments_user_id_fkey(name)")
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  const createdAt = row.created_at ? new Date(row.created_at) : null;
  const authorName = row.author?.name ?? "Unknown";

  let role: string | null = null;
  if (user) {
    const { data } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
    role = data?.role ?? null;
  }

  const canEdit = Boolean(user && (user.id === row.author_id || role === "admin"));

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <div className="flex flex-col gap-6">
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="relative h-64 w-full bg-zinc-100">
            {row.image_url ? (
              <Image src={row.image_url} alt={row.title} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">No image</div>
            )}
          </div>
          <div className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">{row.title}</h1>
                <div className="mt-2 text-sm text-zinc-600">
                  <span>{authorName}</span>
                  <span className="mx-2">•</span>
                  <span>{createdAt ? format(createdAt, "MMM d, yyyy") : ""}</span>
                </div>
              </div>

              {canEdit && (
                <div className="flex items-center gap-2">
                  <Link
                    href={`/posts/${row.id}/edit`}
                    className="inline-flex h-10 items-center justify-center rounded-md border bg-white px-4 text-sm font-medium hover:bg-zinc-50"
                  >
                    Edit
                  </Link>
                  <DeletePostButton postId={row.id} />
                </div>
              )}
            </div>

            {row.summary && (
              <div className="mt-6 rounded-lg border bg-zinc-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">AI Summary</div>
                <p className="mt-2 text-sm leading-6 text-zinc-700">{row.summary}</p>
              </div>
            )}

            <div className="mt-6 whitespace-pre-wrap text-base leading-7 text-zinc-900">{row.body}</div>
          </div>
        </div>

        <section className="rounded-xl border bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Comments</h2>
            <div className="text-sm text-zinc-600">{(comments ?? []).length}</div>
          </div>

          <div className="mt-4 flex flex-col gap-4">
            {(comments as unknown as CommentRow[] | null)?.length ? (
              (comments as unknown as CommentRow[]).map((c) => {
                const d = c.created_at ? new Date(c.created_at) : null;
                return (
                  <div key={c.id} className="rounded-lg border p-4">
                    <div className="text-xs text-zinc-500">
                      <span className="font-medium text-zinc-700">{c.user?.name ?? "Unknown"}</span>
                      <span className="mx-2">•</span>
                      <span>{d ? format(d, "MMM d, yyyy") : ""}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-800">{c.comment_text}</p>
                  </div>
                );
              })
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-zinc-600">No comments yet.</div>
            )}
          </div>

          {user ? (
            <div className="mt-6">
              <CommentForm postId={row.id} />
            </div>
          ) : (
            <div className="mt-6 text-sm text-zinc-600">
              <Link className="underline" href={`/login?redirectTo=/posts/${row.id}`}>
                Log in
              </Link>{" "}
              to comment.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
