create table public.user_watch_later (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  media_id integer not null,
  media_type text not null,
  added_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint user_watch_later_pkey primary key (id),
  constraint user_watch_later_user_id_media_id_media_type_key unique (user_id, media_id, media_type),
  constraint user_watch_later_user_id_fkey foreign KEY (user_id) references auth.users (id),
  constraint user_watch_later_media_type_check check (
    (
      media_type = any (array['movie'::text, 'tv'::text])
    )
  )
) TABLESPACE pg_default;
