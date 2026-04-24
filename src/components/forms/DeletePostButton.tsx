"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";

type Props = {
  postId: string;
};

export default function DeletePostButton({ postId }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDelete = async () => {
    setError(null);

    const ok = window.confirm("Delete this post? This cannot be undone.");
    if (!ok) return;

    setIsLoading(true);

    try {
      const resp = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      const json = (await resp.json().catch(() => ({}))) as { error?: string };

      if (!resp.ok) {
        setError(json.error ?? "Failed to delete post");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete post";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <Button type="button" variant="secondary" onClick={onDelete} disabled={isLoading}>
        {isLoading ? "Deleting..." : "Delete"}
      </Button>
    </div>
  );
}
