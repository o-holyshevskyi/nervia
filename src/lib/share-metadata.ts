import { createAdminClient } from "@/src/lib/supabase/admin";

/**
 * Server-only: fetch share metadata for a slug (cluster name when single group, else null = full graph).
 * Used by generateMetadata in app/share/[slug]/page.tsx.
 */
export async function getShareMetadata(
    slug: string
): Promise<{ clusterName: string | null }> {
    if (!slug?.trim()) return { clusterName: null };

    try {
        const supabase = createAdminClient();
        const { data: share, error: shareError } = await supabase
            .from("shares")
            .select("scope, shared_group_ids")
            .eq("slug", slug.trim())
            .single();

        if (shareError || !share) return { clusterName: null };

        const scope = share.scope as "ALL" | "GROUPS" | undefined;
        const sharedGroupIds: string[] = Array.isArray(share.shared_group_ids)
            ? share.shared_group_ids
            : [];

        if (scope === "GROUPS" && sharedGroupIds.length === 1) {
            const { data: group } = await supabase
                .from("groups")
                .select("name")
                .eq("id", sharedGroupIds[0])
                .single();
            const name = (group as { name?: string } | null)?.name?.trim();
            return { clusterName: name || null };
        }

        return { clusterName: null };
    } catch {
        return { clusterName: null };
    }
}
