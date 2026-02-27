'use client';

import { useState, useEffect, useCallback } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */
export function useOnboarding(supabase: any) {
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    const completeOnboarding = useCallback(async () => {
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) return;
        await supabase.from('profiles').update({
            has_completed_onboarding: true,
            updated_at: new Date().toISOString(),
        }).eq('id', user.id);
        setHasCompletedOnboarding(true);
    }, [supabase]);

    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            if (!supabase) {
                setIsLoading(false);
                return;
            }
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user?.id) {
                    setHasCompletedOnboarding(true);
                    setIsLoading(false);
                    return;
                }

                const { data: rows, error } = await supabase
                    .from('profiles')
                    .select('has_completed_onboarding')
                    .eq('id', user.id);

                if (cancelled) return;

                if (error) {
                    console.error('useOnboarding fetch error:', error);
                    setHasCompletedOnboarding(true);
                    setIsLoading(false);
                    return;
                }

                const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
                if (row && typeof (row as { has_completed_onboarding?: boolean }).has_completed_onboarding === 'boolean') {
                    setHasCompletedOnboarding((row as { has_completed_onboarding: boolean }).has_completed_onboarding);
                } else {
                    const { error: upsertError } = await supabase
                        .from('profiles')
                        .upsert(
                            { id: user.id, has_completed_onboarding: false, updated_at: new Date().toISOString() },
                            { onConflict: 'id' }
                        );
                    if (!cancelled && !upsertError) {
                        setHasCompletedOnboarding(false);
                    } else if (upsertError) {
                        console.error('useOnboarding upsert error:', upsertError);
                        setHasCompletedOnboarding(true);
                    }
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        init();
        return () => { cancelled = true; };
    }, [supabase]);

    return { hasCompletedOnboarding, isLoading, completeOnboarding };
}
