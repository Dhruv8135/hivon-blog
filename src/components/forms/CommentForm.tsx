"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState } from "react";
import Button from "@/components/ui/Button";

type FormValues = {
  commentText: string;
};

type Props = {
  postId: string;
  onSuccess?: () => void;
};

export default function CommentForm({ postId, onSuccess }: Props) {
  const router = useRouter();
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { commentText: "" },
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const resp = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: postId,
          comment_text: values.commentText,
        }),
      });

      const json = (await resp.json().catch(() => ({}))) as { error?: string };

      if (!resp.ok) {
        setError(json.error ?? "Failed to post comment");
        return;
      }

      reset();
      onSuccess?.();
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to post comment";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
      <textarea
        className="min-h-24 rounded-md border px-3 py-2"
        placeholder="Write a comment..."
        {...register("commentText", { required: true })}
      />
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Posting..." : "Comment"}
        </Button>
      </div>
    </form>
  );
}
