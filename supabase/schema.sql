-- Placeholder schema for your blog.
-- When you connect Supabase, you can manage this via SQL editor or migrations.

-- Example tables you might add later:
-- profiles (linked to auth.users)
-- posts
-- post_tags
-- comments

 create extension if not exists "pgcrypto";

 create table if not exists public.users (
   id uuid primary key default gen_random_uuid(),
   name text,
   email text unique,
   role text not null default 'viewer',
   created_at timestamptz not null default now()
 );

 create table if not exists public.posts (
   id uuid primary key default gen_random_uuid(),
   title text not null,
   body text not null,
   image_url text,
   summary text,
   author_id uuid not null references public.users(id) on delete restrict,
   created_at timestamptz not null default now()
 );

 create index if not exists posts_author_id_idx on public.posts(author_id);

 create table if not exists public.comments (
   id uuid primary key default gen_random_uuid(),
   post_id uuid not null references public.posts(id) on delete cascade,
   user_id uuid not null references public.users(id) on delete restrict,
   comment_text text not null,
   created_at timestamptz not null default now()
 );

 create index if not exists comments_post_id_idx on public.comments(post_id);
 create index if not exists comments_user_id_idx on public.comments(user_id);

 alter table public.users enable row level security;
 alter table public.posts enable row level security;
 alter table public.comments enable row level security;

 create or replace function public.is_admin()
 returns boolean
 language sql
 stable
 as $$
   select exists (
     select 1
     from public.users u
     where u.id = auth.uid()
       and u.role = 'admin'
   );
 $$;

 create or replace function public.is_author(target_author_id uuid)
 returns boolean
 language sql
 stable
 as $$
   select auth.uid() is not null and auth.uid() = target_author_id;
 $$;

 drop policy if exists "users_read" on public.users;
 create policy "users_read"
 on public.users
 for select
 to authenticated
 using (true);

 drop policy if exists "posts_read" on public.posts;
 create policy "posts_read"
 on public.posts
 for select
 to authenticated
 using (true);

 drop policy if exists "posts_insert_own" on public.posts;
 create policy "posts_insert_own"
 on public.posts
 for insert
 to authenticated
 with check (
   public.is_admin()
   or public.is_author(author_id)
 );

 drop policy if exists "posts_update_own_or_admin" on public.posts;
 create policy "posts_update_own_or_admin"
 on public.posts
 for update
 to authenticated
 using (
   public.is_admin()
   or public.is_author(author_id)
 )
 with check (
   public.is_admin()
   or public.is_author(author_id)
 );

 drop policy if exists "posts_delete_own_or_admin" on public.posts;
 create policy "posts_delete_own_or_admin"
 on public.posts
 for delete
 to authenticated
 using (
   public.is_admin()
   or public.is_author(author_id)
 );

 drop policy if exists "comments_read" on public.comments;
 create policy "comments_read"
 on public.comments
 for select
 to authenticated
 using (true);

 drop policy if exists "comments_insert_own" on public.comments;
 create policy "comments_insert_own"
 on public.comments
 for insert
 to authenticated
 with check (
   public.is_admin()
   or auth.uid() = user_id
 );
