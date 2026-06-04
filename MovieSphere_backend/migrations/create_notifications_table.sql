create table public.user_notifications (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  title text not null,
  body text not null,
  media_id integer,
  media_type text,
  poster_url text,
  type text not null default 'release',
  is_read boolean not null default false,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint user_notifications_pkey primary key (id),
  constraint user_notifications_user_id_fkey foreign key (user_id) references auth.users (id)
) TABLESPACE pg_default;

create index if not exists idx_notifications_user_id on public.user_notifications (user_id);
create index if not exists idx_notifications_created_at on public.user_notifications (created_at desc);
