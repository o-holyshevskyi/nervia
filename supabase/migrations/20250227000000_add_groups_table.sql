-- Custom user groups: name + color per user.
-- Every user should have at least one group (e.g. "General") for AI fallback.
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#64748b',
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique name per user (case-insensitive not enforced here; app can enforce).
CREATE UNIQUE INDEX IF NOT EXISTS groups_user_id_name_key ON public.groups (user_id, LOWER(TRIM(name)));

-- RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own groups"
    ON public.groups
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Ensure sort_order exists (in case table was created from an older migration).
ALTER TABLE public.groups
    ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

-- Add group_id to nodes (nullable for backward compatibility with legacy numeric group).
ALTER TABLE public.nodes
    ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.nodes.group_id IS 'User-defined category; null falls back to legacy group (1-5).';
