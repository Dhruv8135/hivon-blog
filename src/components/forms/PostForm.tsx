"use client";

import { useForm } from "react-hook-form";
import Button from "@/components/ui/Button";

type Props = {
  mode: "create" | "edit";
  postId?: string;
};

type FormValues = {
  title: string;
  body: string;
  summary?: string;
  imageUrl?: string;
};

export default function PostForm({ mode, postId }: Props) {
  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      title: "",
      body: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    console.log({ mode, postId, values });
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Title</span>
        <input className="rounded-md border px-3 py-2" {...register("title")} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Body</span>
        <textarea className="min-h-40 rounded-md border px-3 py-2" {...register("body")} />
      </label>
      <div className="flex gap-3">
        <Button type="submit">{mode === "create" ? "Create" : "Save"}</Button>
      </div>
    </form>
  );
}
