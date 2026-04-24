import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
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
    <div className="min-h-[calc(100vh-4rem)] bg-[#070A12] text-white">
      <section className="border-b border-white/10">
        <div className="bg-linear-to-b from-indigo-950/60 via-[#070A12] to-[#070A12]">
          <div className="mx-auto w-full max-w-6xl px-6 py-14">
            <div className="flex flex-col gap-8">
              <div>
                <h1 className="mt-4 text-5xl font-semibold tracking-tight sm:text-6xl">Blog</h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-white/70">
                  Stories, ideas, and deep dives — with a clean, modern reading experience.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <form action="/" method="GET" className="flex w-full items-center gap-2 sm:max-w-xl">
                  <div className="flex h-11 flex-1 items-center rounded-md border border-white/10 bg-white/5 px-3">
                    <input
                      name="q"
                      defaultValue={q}
                      placeholder="Search posts by title..."
                      className="h-full w-full bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex h-11 items-center justify-center rounded-md bg-linear-to-r from-violet-600 to-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:from-violet-500 hover:to-indigo-500"
                  >
                    Search
                  </button>
                </form>

                {user && (
                  <Link
                    href="/posts/new"
                    className="inline-flex h-11 items-center justify-center rounded-md border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    Create Post
                  </Link>
                )}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>
                    Page <span className="text-white">{page}</span> of <span className="text-white">{totalPages}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      href={buildUrl(page - 1)}
                      aria-disabled={page <= 1}
                      className={`inline-flex h-10 items-center justify-center rounded-md border border-white/10 px-4 text-sm ${
                        page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-white/5"
                      }`}
                    >
                      Prev
                    </Link>
                    <Link
                      href={buildUrl(page + 1)}
                      aria-disabled={page >= totalPages}
                      className={`inline-flex h-10 items-center justify-center rounded-md border border-white/10 px-4 text-sm ${
                        page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-white/5"
                      }`}
                    >
                      Next
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        {error && (
          <div className="rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error.message}
          </div>
        )}

        {!error && (!posts || posts.length === 0) ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
            <h2 className="text-lg font-semibold">No posts yet</h2>
            <p className="mt-2 text-sm text-white/60">Be the first to write something.</p>
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
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:bg-white/10"
                >
                  <Link href={`/posts/${row.id}`} className="block">
                    <div className="relative h-48 w-full bg-white/5">
                      {imageUrl ? (
                        <>
                          <Image
                            src={imageUrl}
                            alt={row.title || "Post image"}
                            fill
                            className="object-cover transition duration-300 group-hover:scale-[1.02]"
                          />
                          <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/0 to-black/0" />
                        </>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-white/50">No image</div>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 p-5">
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        <span className="text-white/80">{authorName}</span>
                        <span aria-hidden="true">•</span>
                        <span>{createdAt ? format(createdAt, "MMM d, yyyy") : ""}</span>
                      </div>

                      <h2 className="line-clamp-2 text-lg font-semibold leading-6 tracking-tight">
                        {row.title}
                      </h2>

                      <p className="line-clamp-3 text-sm leading-6 text-white/70">{truncate(summary, 160)}</p>

                      <div className="pt-1 text-sm font-semibold text-violet-200 group-hover:text-violet-100">
                        Read article
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-6">
            <Link
              href={buildUrl(page - 1)}
              aria-disabled={page <= 1}
              className={`inline-flex h-11 items-center justify-center rounded-md border border-white/10 px-4 text-sm ${
                page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-white/5"
              }`}
            >
              Prev
            </Link>

            <div className="text-sm text-white/70">
              Page <span className="text-white">{page}</span> of <span className="text-white">{totalPages}</span>
            </div>

            <Link
              href={buildUrl(page + 1)}
              aria-disabled={page >= totalPages}
              className={`inline-flex h-11 items-center justify-center rounded-md border border-white/10 px-4 text-sm ${
                page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-white/5"
              }`}
            >
              Next
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
