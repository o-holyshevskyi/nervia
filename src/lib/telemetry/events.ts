/**
 * Telemetry event names and property types.
 * Rule: only metadata in properties (counts, types, lengths). No note content, titles, or URLs.
 */

export const TELEMETRY_EVENTS = {
    // Import
    IMPORT_STARTED: 'import_started',
    IMPORT_COMPLETED: 'import_completed',
    IMPORT_FAILED: 'import_failed',
    // AI (Neural Core)
    AI_REQUEST_SENT: 'ai_request_sent',
    AI_RESPONSE_RECEIVED: 'ai_response_received',
    AI_GENERATION_COMPLETED: 'ai_generation_completed',
    // Graph
    TIME_MACHINE_USED: 'time_machine_used',
    PATHFINDER_ACTIVATED: 'pathfinder_activated',
    FOCUS_MODE_TOGGLED: 'focus_mode_toggled',
    // Conversion
    UPGRADE_MODAL_VIEWED: 'upgrade_modal_viewed',
    UPGRADE_BUTTON_CLICKED: 'upgrade_button_clicked',
    // Server
    DB_OPERATION_COMPLETED: 'db_operation_completed',
} as const

export type ImportSource = 'notion' | 'obsidian' | 'html' | 'json'

export interface ImportStartedProperties {
    source: ImportSource
}

export interface ImportCompletedProperties {
    source: ImportSource
    total_items: number
    skipped_duplicates: number
    duration_ms: number
}

export interface ImportFailedProperties {
    source: ImportSource
    error_message: string
    file_extension?: string
}

export type AIEndpoint = 'chat' | 'process'

export interface AIRequestSentProperties {
    endpoint: AIEndpoint
    batch_size: number
}

export interface AIResponseReceivedProperties {
    endpoint: AIEndpoint
    batch_size: number
    latency_ms: number
    success: boolean
    error_type?: string
}

export interface AIGenerationCompletedProperties {
    mode: 'analyze_link' | 'suggest_connections'
    batch_size: number
}

export interface FocusModeToggledProperties {
    expanded: boolean
}

export type UpgradeTargetPlan = 'constellation' | 'singularity'

export interface UpgradeModalViewedProperties {
    target_plan: UpgradeTargetPlan
}

export interface UpgradeButtonClickedProperties {
    target_plan: UpgradeTargetPlan
    destination?: string
}

export interface DBOperationCompletedProperties {
    operation: string
    count: number
}
