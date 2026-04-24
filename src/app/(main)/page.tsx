import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 6;

type PostRow = {
  id: string;
  title: string;
  summary: string | null;
  image_url: string | null;
  created_at: string;
  author: { name: string | null } | null;
};

type SearchParams = {
  q?: string;
  page?: string;
};

function truncate(text: string, max: number) {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}...`;
}

export default async function MainHomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const page = Math.max(1, Number.parseInt(String(sp.page ?? "1"), 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("posts")
    .select("id,title,summary,image_url,created_at,author:users!posts_author_id_fkey(name)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (q) {
    query = query.ilike("title", `%${q}%`);
  }

  const { data: posts, error, count } = await query.range(from, to);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildUrl = (nextPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (nextPage > 1) params.set("page", String(nextPage));
    const s = params.toString();
    return s ? `/?${s}` : "/";
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Hivon Blog</h1>
            <p className="mt-1 text-sm text-zinc-600">Stories, updates, and ideas.</p>
          </div>

          <div className="flex items-center gap-3">
            <form action="/" method="GET" className="flex items-center gap-2">
              <input
                name="q"
                defaultValue={q}
                placeholder="Search posts by title..."
                className="h-10 w-72 rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
              />
              <ButtonLike>Search</ButtonLike>
            </form>

            {user && (
              <Link
                href="/posts/new"
                className="inline-flex h-10 items-center justify-center rounded-md bg-black px-4 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Create Post
              </Link>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error.message}
          </div>
        )}

        {!error && (!posts || posts.length === 0) ? (
          <div className="rounded-xl border bg-white p-10 text-center">
            <h2 className="text-lg font-semibold">No posts yet</h2>
            <p className="mt-2 text-sm text-zinc-600">Be the first to write something.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(posts ?? []).map((post) => {
              const row = post as unknown as PostRow;
              const authorName = row.author?.name ?? "Unknown";
              const createdAt = row.created_at ? new Date(row.created_at) : null;
              const summary = row.summary ?? "";
              const imageUrl = row.image_url ?? "";

              return (
                <article
                  key={row.id}
                  className="group overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-md"
                >
                  <Link href={`/posts/${row.id}`} className="block">
                    <div className="relative h-44 w-full bg-zinc-100">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={row.title || "Post image"}
                          fill
                          className="object-cover transition group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 p-5">
                      <h2 className="line-clamp-2 text-lg font-semibold leading-6 tracking-tight">
                        {row.title}
                      </h2>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span>{authorName}</span>
                        <span aria-hidden="true">•</span>
                        <span>{createdAt ? format(createdAt, "MMM d, yyyy") : ""}</span>
                      </div>
                      <p className="text-sm leading-6 text-zinc-700">{truncate(summary, 150)}</p>
                      <div className="pt-1 text-sm font-medium text-zinc-900 group-hover:underline">Read more</div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <Link
              href={buildUrl(page - 1)}
              aria-disabled={page <= 1}
              className={`inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm ${
                page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-zinc-50"
              }`}
            >
              Prev
            </Link>

            <div className="text-sm text-zinc-600">
              Page {page} of {totalPages}
            </div>

            <Link
              href={buildUrl(page + 1)}
              aria-disabled={page >= totalPages}
              className={`inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm ${
                page >= totalPages ? "pointer-events-none opacity-50" : "hover:bg-zinc-50"
              }`}
            >
              Next
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function ButtonLike({ children }: { children: ReactNode }) {
  return (
    <button
      type="submit"
      className="inline-flex h-10 items-center justify-center rounded-md border bg-white px-4 text-sm font-medium hover:bg-zinc-50"
    >
      {children}
    </button>
  );
}
