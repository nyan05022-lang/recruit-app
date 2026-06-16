-- Enable pgvector for AI matching
create extension if not exists vector;

-- Users (managed by Supabase Auth, extended here)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null check (role in ('student', 'company')),
  created_at timestamptz default now()
);

-- Student profiles
create table public.student_profiles (
  id uuid references public.profiles on delete cascade primary key,
  full_name text not null,
  university text,
  faculty text,
  graduation_year int,
  status text check (status in ('undergraduate', 'graduate', 'other')),
  es_text text,
  qualifications text[],
  self_pr text,
  is_public boolean default true,
  embedding vector(1536),
  updated_at timestamptz default now()
);

-- Company profiles
create table public.company_profiles (
  id uuid references public.profiles on delete cascade primary key,
  company_name text not null,
  industry text,
  description text,
  updated_at timestamptz default now()
);

-- Job requirements posted by companies
create table public.job_requirements (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.company_profiles on delete cascade not null,
  title text not null,
  description text not null,
  required_qualifications text[],
  preferred_universities text[],
  graduation_year_min int,
  graduation_year_max int,
  embedding vector(1536),
  created_at timestamptz default now()
);

-- Scout messages from companies to students
create table public.scouts (
  id uuid default gen_random_uuid() primary key,
  requirement_id uuid references public.job_requirements on delete cascade,
  company_id uuid references public.company_profiles not null,
  student_id uuid references public.student_profiles not null,
  message text not null,
  match_score float,
  match_reason text,
  status text default 'sent' check (status in ('sent', 'read', 'replied', 'declined')),
  reply_message text,
  created_at timestamptz default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.student_profiles enable row level security;
alter table public.company_profiles enable row level security;
alter table public.job_requirements enable row level security;
alter table public.scouts enable row level security;

-- profiles: users can read/write their own
create policy "own profile" on public.profiles for all using (auth.uid() = id);

-- student_profiles: owner full access, others can read public profiles
create policy "student own" on public.student_profiles for all using (auth.uid() = id);
create policy "student public read" on public.student_profiles for select using (is_public = true);

-- company_profiles: owner full access, students can read
create policy "company own" on public.company_profiles for all using (auth.uid() = id);
create policy "company public read" on public.company_profiles for select using (true);

-- job_requirements: company owns, all can read
create policy "req own" on public.job_requirements for all using (auth.uid() = company_id);
create policy "req public read" on public.job_requirements for select using (true);

-- scouts: company sends, student reads their own
create policy "scout company" on public.scouts for insert using (auth.uid() = company_id);
create policy "scout company read" on public.scouts for select using (auth.uid() = company_id);
create policy "scout student read" on public.scouts for select using (auth.uid() = student_id);
create policy "scout student reply" on public.scouts for update using (auth.uid() = student_id);

-- Function: cosine similarity search for matching
create or replace function match_students(
  query_embedding vector(1536),
  match_threshold float default 0.5,
  match_count int default 20
)
returns table (
  id uuid,
  full_name text,
  university text,
  faculty text,
  graduation_year int,
  qualifications text[],
  self_pr text,
  similarity float
)
language sql stable
as $$
  select
    sp.id,
    sp.full_name,
    sp.university,
    sp.faculty,
    sp.graduation_year,
    sp.qualifications,
    sp.self_pr,
    1 - (sp.embedding <=> query_embedding) as similarity
  from public.student_profiles sp
  where
    sp.is_public = true
    and sp.embedding is not null
    and 1 - (sp.embedding <=> query_embedding) > match_threshold
  order by sp.embedding <=> query_embedding
  limit match_count;
$$;
