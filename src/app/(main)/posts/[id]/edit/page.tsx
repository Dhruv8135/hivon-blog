import Link from "next/link";
import EditPostForm from "@/components/forms/EditPostForm";
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
};

export default async function EditPostPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Not authorized</h1>
        <p className="mt-2 text-sm text-zinc-600">
          <Link className="underline" href={`/login?redirectTo=/posts/${id}/edit`}>
            Log in
          </Link>{" "}
          to edit this post.
        </p>
      </div>
    );
  }

  const { data: post, error } = await supabase
    .from("posts")
    .select("id,title,body,image_url,summary,author_id")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error.message}</div>
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

  const { data: userRow } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
  const isAdmin = userRow?.role === "admin";
  const isAuthor = (post as PostRow).author_id === user.id;

  if (!isAdmin && !isAuthor) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Forbidden</h1>
        <p className="mt-2 text-sm text-zinc-600">You can only edit your own posts.</p>
      </div>
    );
  }

  const row = post as unknown as PostRow;

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Post</h1>
        <Link className="text-sm underline" href={`/posts/${row.id}`}>
          Back to post
        </Link>
      </div>

      <div className="mt-6">
        <EditPostForm postId={row.id} initialValues={{ title: row.title, body: row.body, image_url: row.image_url }} />
      </div>
    </div>
  );
}
