-- Create tables with RLS (Row Level Security) policies
-- Enable the pgcrypto extension for UUID generation
create extension if not exists pgcrypto;

-- Create templates table
create table public.templates (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  content jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create documents table
create table public.documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  template_id uuid references public.templates(id) on delete cascade not null,
  title text,
  content jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create profiles table for additional user data
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
-- Enable RLS on all tables
alter table public.templates enable row level security;
alter table public.documents enable row level security;
alter table public.profiles enable row level security;

-- Templates are readable by all, but only writeable by authenticated users
create policy "Templates are viewable by everyone" on public.templates
  for select using (true);

create policy "Templates are insertable by authenticated users only" on public.templates
  for insert with check (auth.role() = 'authenticated');

create policy "Templates are updatable by authenticated users only" on public.templates
  for update using (auth.role() = 'authenticated');

-- Documents are only accessible by their owners
create policy "Documents are viewable by owner only" on public.documents
  for select using (auth.uid() = user_id);

create policy "Documents are insertable by owner only" on public.documents
  for insert with check (auth.uid() = user_id);

create policy "Documents are updatable by owner only" on public.documents
  for update using (auth.uid() = user_id);

create policy "Documents are deletable by owner only" on public.documents
  for delete using (auth.uid() = user_id);

-- Profiles are viewable by everyone but only updatable by the owner
create policy "Profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Profiles are updatable by owner only" on public.profiles
  for update using (auth.uid() = id);

-- Create trigger to automatically create a profile for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data->>'name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
