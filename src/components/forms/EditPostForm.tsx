"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Button from "@/components/ui/Button";
import { createBrowserClient } from "@/lib/supabase/client";

type Props = {
  postId: string;
  initialValues: {
    title: string;
    body: string;
    image_url: string | null;
  };
};

type FormValues = {
  title: string;
  body: string;
  image?: FileList;
};

export default function EditPostForm({ postId, initialValues }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(), []);

  const [formError, setFormError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(initialValues.image_url);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      title: initialValues.title,
      body: initialValues.body,
    },
    resolver: zodResolver(
      z.object({
        title: z.string().min(1, "Title is required"),
        body: z.string().min(1, "Body is required"),
      })
    ),
  });

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

    const file = values.image?.[0];
    if (file) {
      await uploadFeaturedImage(file);
    }

    const resp = await fetch(`/api/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: values.title,
        body: values.body,
        image_url: imageUrl,
      }),
    });

    const json = (await resp.json().catch(() => ({}))) as { error?: string };

    if (!resp.ok) {
      setFormError(json.error ?? "Failed to update post");
      return;
    }

    router.replace(`/posts/${postId}`);
    router.refresh();
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Title</span>
        <input className="rounded-md border px-3 py-2" {...register("title")} />
        {errors.title && <span className="text-sm text-red-600">{errors.title.message}</span>}
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Body</span>
        <textarea className="min-h-56 rounded-md border px-3 py-2" {...register("body")} />
        {errors.body && <span className="text-sm text-red-600">{errors.body.message}</span>}
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Featured Image</span>
        <input type="file" accept="image/*" disabled={isUploadingImage || isSubmitting} {...register("image")} />
        {isUploadingImage && <span className="text-sm text-zinc-600">Uploading image...</span>}
        {imageUrl && (
          <a className="text-sm underline" href={imageUrl} target="_blank" rel="noreferrer">
            View current image
          </a>
        )}
      </label>

      {formError && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting || isUploadingImage}>
          {isSubmitting ? "Saving..." : "Save changes"}
        </Button>
        <a className="text-sm underline" href={`/posts/${postId}`}>
          Cancel
        </a>
      </div>
    </form>
  );
}
