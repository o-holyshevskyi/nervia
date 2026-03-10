'use client'

import { useMemo } from 'react'
import { createClient } from '@/src/lib/supabase/client'
import { useTelemetry } from '@/src/hooks/useTelemetry'

export default function TelemetryProvider({ children }: { children: React.ReactNode }) {
    const supabase = useMemo(() => createClient(), [])
    useTelemetry(supabase)
    return <>{children}</>
}
