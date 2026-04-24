export type UserRole = "admin" | "author" | "viewer";

export type User = {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  created_at: string;
};

export type Post = {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  summary: string | null;
  author_id: string;
  created_at: string;
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
};
