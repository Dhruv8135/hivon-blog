"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Button from "@/components/ui/Button";
import { createBrowserClient } from "@/lib/supabase/client";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
});

type FormValues = z.infer<typeof schema>;

export default function NewPostPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(), []);

  const [formError, setFormError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const uploadFeaturedImage = async (file: File) => {
    setFormError(null);
    setIsUploadingImage(true);

    try {
      const ext = file.name.split(".").pop() || "bin";
      const filename = `${crypto.randomUUID()}.${ext}`;
      const path = `featured/${filename}`;

      const { error: uploadError } = await supabase.storage.from("post-images").upload(path, file, {
        upsert: false,
        cacheControl: "3600",
        contentType: file.type || undefined,
      });

      if (uploadError) {
        setFormError(uploadError.message);
        return;
      }

      const { data } = supabase.storage.from("post-images").getPublicUrl(path);
      setImageUrl(data.publicUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Image upload failed";
      setFormError(message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setFormError(null);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      setFormError(userError.message);
      return;
    }

    if (!user) {
      setFormError("You must be logged in to create a post.");
      return;
    }

    setIsGeneratingSummary(true);
    let summary = "";

    try {
      const resp = await fetch("/api/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: values.body }),
      });

      const json = (await resp.json().catch(() => ({}))) as { summary?: string; error?: string };

      if (!resp.ok) {
        setFormError(json.error ?? "Failed to generate summary");
        return;
      }

      summary = json.summary ?? "";
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate summary";
      setFormError(message);
      return;
    } finally {
      setIsGeneratingSummary(false);
    }

    const { error: insertError } = await supabase.from("posts").insert({
      title: values.title,
      body: values.body,
      image_url: imageUrl,
      summary,
      author_id: user.id,
    });

    if (insertError) {
      setFormError(insertError.message);
      return;
    }

    router.replace("/");
    router.refresh();
  };

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">New Post</h1>
      <p className="mt-2 text-sm text-zinc-600">Create a new blog post.</p>

      <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Title</span>
          <input className="rounded-md border px-3 py-2" placeholder="Post title" {...register("title")} />
          {errors.title && <span className="text-sm text-red-600">{errors.title.message}</span>}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Body</span>
          <textarea className="min-h-56 rounded-md border px-3 py-2" placeholder="Write your post..." {...register("body")} />
          {errors.body && <span className="text-sm text-red-600">{errors.body.message}</span>}
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Featured Image</span>
          <input
            type="file"
            accept="image/*"
            disabled={isUploadingImage}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                void uploadFeaturedImage(file);
              }
            }}
          />
          {isUploadingImage && <span className="text-sm text-zinc-600">Uploading image...</span>}
          {imageUrl && (
            <a className="text-sm underline" href={imageUrl} target="_blank" rel="noreferrer">
              View uploaded image
            </a>
          )}
        </label>

        {formError && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSubmitting || isUploadingImage || isGeneratingSummary}>
            {isSubmitting ? "Creating..." : "Create Post"}
          </Button>
          {isGeneratingSummary && (
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-800" />
              Generating summary...
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
