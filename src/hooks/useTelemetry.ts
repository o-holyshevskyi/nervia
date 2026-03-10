'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'

type PlanId = 'genesis' | 'constellation' | 'singularity'

export function useTelemetry(supabase: ReturnType<typeof import('@/src/lib/supabase/client').createClient>) {
    useEffect(() => {
        if (typeof window === 'undefined') return

        const syncUser = async (user: { id: string; email?: string | null; user_metadata?: { plan?: unknown } } | null) => {
            if (!user) {
                posthog.reset()
                return
            }
            const plan = (user.user_metadata?.plan as PlanId | undefined)
                ? (user.user_metadata?.plan as PlanId)
                : 'genesis'
            posthog.identify(user.id, {
                email: user.email ?? undefined,
                plan,
            })
        }

        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            await syncUser(user)
        }
        init()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            syncUser(session?.user ?? null)
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [supabase])
}
