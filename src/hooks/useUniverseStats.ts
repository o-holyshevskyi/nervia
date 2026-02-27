/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { createClient } from '../lib/supabase/client';

interface UniverseStats {
  nodesCount: number;
  linksCount: number;
  topTag: string | null;
}

export function useUniverseStats(nodes: any[]) {
  const supabase = createClient();
  const [stats, setStats] = useState<UniverseStats>({
    nodesCount: 0,
    linksCount: 0,
    topTag: null,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const nodesLength = nodes?.length ?? 0;

  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          if (!cancelled) {
            setStats({
              nodesCount: 0,
              linksCount: 0,
              topTag: null,
            });
          }
          return;
        }

        const [nodesCountRes, linksCountRes, tagsRes] = await Promise.all([
          supabase
            .from('nodes')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
          supabase
            .from('links')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
          supabase
            .from('nodes')
            .select('tags')
            .eq('user_id', user.id),
        ]);

        if (nodesCountRes.error) throw nodesCountRes.error;
        if (linksCountRes.error) throw linksCountRes.error;
        if (tagsRes.error) throw tagsRes.error;

        const nodesCount = nodesCountRes.count ?? 0;
        const linksCount = linksCountRes.count ?? 0;

        let topTag: string | null = null;

        const allTags: string[] = [];
        (tagsRes.data || []).forEach((row: any) => {
          if (Array.isArray(row.tags)) {
            row.tags.forEach((tag: unknown) => {
              if (typeof tag === 'string' && tag.trim().length > 0) {
                allTags.push(tag.trim());
              }
            });
          }
        });

        if (allTags.length > 0) {
          const frequency = new Map<string, number>();
          for (const tag of allTags) {
            frequency.set(tag, (frequency.get(tag) ?? 0) + 1);
          }

          let maxTag: string | null = null;
          let maxCount = 0;
          frequency.forEach((count, tag) => {
            if (count > maxCount) {
              maxCount = count;
              maxTag = tag;
            }
          });

          topTag = maxTag;
        }

        if (!cancelled) {
          setStats({
            nodesCount,
            linksCount,
            topTag,
          });
        }
      } catch (err) {
        console.error('Failed to load universe stats', err);
        if (!cancelled) {
          setError('Failed to load stats');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, [supabase, nodesLength]);

  return {
    nodesCount: stats.nodesCount,
    linksCount: stats.linksCount,
    topTag: stats.topTag,
    isLoading,
    error,
  };
}

