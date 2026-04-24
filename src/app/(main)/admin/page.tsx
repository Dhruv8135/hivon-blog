import Link from "next/link";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";

type PostRow = {
  id: string;
  title: string;
  created_at: string;
  author: { name: string | null } | null;
};

type CommentRow = {
  id: string;
  comment_text: string;
  created_at: string;
  post: { id: string; title: string } | null;
  user: { name: string | null } | null;
};

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-5xl p-6">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="mt-2 text-sm text-zinc-600">
          <Link className="underline" href="/login?redirectTo=/admin">
            Log in
          </Link>{" "}
          to access the admin dashboard.
        </p>
      </div>
    );
  }

  const { data: userRow } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();

  if (userRow?.role !== "admin") {
    return (
      <div className="mx-auto w-full max-w-5xl p-6">
        <h1 className="text-2xl font-semibold">Forbidden</h1>
        <p className="mt-2 text-sm text-zinc-600">Admin access required.</p>
      </div>
    );
  }

  const { data: posts } = await supabase
    .from("posts")
    .select("id,title,created_at,author:users!posts_author_id_fkey(name)")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: comments } = await supabase
    .from("comments")
    .select(
      "id,comment_text,created_at,post:posts!comments_post_id_fkey(id,title),user:users!comments_user_id_fkey(name)"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto w-full max-w-5xl p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-600">Moderate posts and comments.</p>
        </div>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-md border bg-white px-4 text-sm font-medium hover:bg-zinc-50"
        >
          Back to site
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Posts</h2>
            <div className="text-sm text-zinc-600">{(posts ?? []).length}</div>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {(posts as unknown as PostRow[] | null)?.length ? (
              (posts as unknown as PostRow[]).map((p) => {
                const d = p.created_at ? new Date(p.created_at) : null;
                return (
                  <div key={p.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Link className="font-medium hover:underline" href={`/posts/${p.id}`}>
                          {p.title}
                        </Link>
                        <div className="mt-1 text-xs text-zinc-500">
                          <span>{p.author?.name ?? "Unknown"}</span>
                          <span className="mx-2">•</span>
                          <span>{d ? format(d, "MMM d, yyyy") : ""}</span>
                        </div>
                      </div>
                      <Link className="text-sm underline" href={`/posts/${p.id}/edit`}>
                        Edit
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-zinc-600">No posts found.</div>
            )}
          </div>
        </section>

        <section className="rounded-xl border bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Comments</h2>
            <div className="text-sm text-zinc-600">{(comments ?? []).length}</div>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {(comments as unknown as CommentRow[] | null)?.length ? (
              (comments as unknown as CommentRow[]).map((c) => {
                const d = c.created_at ? new Date(c.created_at) : null;
                return (
                  <div key={c.id} className="rounded-lg border p-4">
                    <div className="text-xs text-zinc-500">
                      <span className="font-medium text-zinc-700">{c.user?.name ?? "Unknown"}</span>
                      <span className="mx-2">•</span>
                      <span>{d ? format(d, "MMM d, yyyy") : ""}</span>
                      {c.post && (
                        <>
                          <span className="mx-2">•</span>
                          <Link className="underline" href={`/posts/${c.post.id}`}>
                            {c.post.title}
                          </Link>
                        </>
                      )}
                    </div>
                    <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-zinc-800">{c.comment_text}</p>
                  </div>
                );
              })
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-zinc-600">No comments found.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
