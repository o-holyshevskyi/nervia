/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/src/lib/supabase/server";
import { cleanJsonString, isRateLimitError, isNoGroupResponse } from "@/src/lib/aiHelpers";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const DEFAULT_GROUP_COLOR = '#64748b';

/** Palette of distinct colors for auto-created groups (AI-suggested). */
const GROUP_COLOR_PALETTE = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#eab308',
    '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#64748b', '#4f46e5',
];

function randomGroupColor(): string {
    return GROUP_COLOR_PALETTE[Math.floor(Math.random() * GROUP_COLOR_PALETTE.length)];
}

/**
 * Resolve AI groupName to group_id.
 * - If groupName is "No group" / empty / none → return null (node stays No Group).
 * - If groupName matches an existing user group → return that group's id.
 * - If groupName is a new category suggestion → create the group and return its id.
 */
async function resolveOrCreateGroupId(
    groupName: string | undefined,
    groups: { id: string; name: string }[],
    userId: string,
    supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string | null> {
    if (isNoGroupResponse(groupName)) return null;

    const trimmed = groupName!.trim();
    const normalized = trimmed.toLowerCase();
    const found = groups.find((g) => g.name.trim().toLowerCase() === normalized);
    if (found) return found.id;

    const { data: inserted, error } = await supabase
        .from('groups')
        .insert({
            user_id: userId,
            name: trimmed,
            color: randomGroupColor(),
            sort_order: groups.length,
        })
        .select('id')
        .single();

    if (error) {
        if (error.code === '23505') {
            const again = groups.find((g) => g.name.trim().toLowerCase() === normalized);
            return again?.id ?? null;
        }
        console.error('resolveOrCreateGroupId insert error:', error);
        return null;
    }
    return (inserted as { id: string })?.id ?? null;
}

/**
 * @swagger
 * /api/ai/process:
 *   post:
 *     description: AI processing for the knowledge graph. Modes - suggest_connections (find related neurons + category) or analyze_link (summary, tags, connections for a new link).
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mode:
 *                 type: string
 *                 enum: [suggest_connections, analyze_link]
 *               newNode:
 *                 type: object
 *               existingNodes:
 *                 type: array
 *     responses:
 *       200:
 *         description: Processed result (description/summary, connections, group_id, tags).
 *       401:
 *         description: Unauthorized.
 *       429:
 *         description: Rate limit (RATE_LIMIT, retryAfterSeconds).
 *       500:
 *         description: API key missing or server error.
 */
export async function POST(req: Request) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.error("🔴 GEMINI_API_KEY is missing in .env.local");
            return NextResponse.json({ error: "API Key missing" }, { status: 500 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let { data: groupsRows } = await supabase
            .from('groups')
            .select('id, name')
            .eq('user_id', user.id)
            .order('sort_order', { ascending: true })
            .order('name', { ascending: true });

        const groups = (groupsRows || []) as { id: string; name: string }[];
        const categoryNames = groups.map((g) => g.name).join(', ');
        const categoryInstruction = `CATEGORY (groupName): You MUST assign a category whenever the link is recognizable.
- If the user has existing categories and one fits, return that exact name: ${categoryNames || '(user has no categories yet)'}.
- Otherwise suggest a short new category (1-3 words). Examples: design tools (Canva, Figma) → "Design" or "Design Tools"; productivity (Notion, Todoist) → "Productivity"; dev tools → "Developer Tools"; AI products → "AI & ML"; learning → "Learning"; social → "Social"; finance → "Finance"; reading/news → "Reading". We will create the group and assign the node.
- Return "No group" ONLY when the content is truly uncategorizable (e.g. random personal note with no clear domain). For any known product, brand, or topic, always suggest a category—e.g. Canva → "Design", Notion → "Productivity".`;

        const { mode, newNode, existingNodes } = await req.json();
        const model = genAI.getGenerativeModel({ model: "gemma-3-27b-it" });

        if (mode === 'suggest_connections') {
            const prompt = `
                You are a precise semantic architect building a knowledge graph.

                NEW NEURON: "${newNode.id || newNode.title}"
                TYPE: ${newNode.type || 'unknown'}
                URL: ${newNode.url || 'No URL provided.'}
                CONTEXT: ${newNode.content || 'No additional context provided.'}
                
                EXISTING NEURONS: ${existingNodes.join(', ')}
                
                TASK:
                Identify neurons from the list that have a DIRECT and SPECIFIC relationship with the NEW NEURON.
                
                STRICT FILTERING CRITERIA:
                1. CATEGORY MATCH: Only connect if they belong to the same narrow niche (e.g., 'LLM Tools', 'Social Platforms', 'Database').
                2. AVOID GENERIC TECH LINKS: Do NOT connect just because both are "websites", "apps", or "popular tech tools". 
                3. SPECIFICITY: A connection between "YouTube" and "Gemini" is usually WEAK (low accuracy) unless the context explicitly mentions a video about Gemini.
                4. ACCURACY SCORING: 
                - 90-100%: Identical purpose or direct integration (e.g., Supabase and Postgres).
                - 80-89%: Strong functional dependency or sub-topic.
                - Below 80%: Discard (e.g., Reddit and ChatGPT are too broad to be "80% related").

                RULES:
                - If Context is empty, generate a 1-3 sentence description for the NEW neuron.
                - If the TYPE is 'note' or 'idea' generate the content or suggestions based on the NEW neuron.
                - RETURN EMPTY ARRAY if no strong (80%+) matches are found.
                - ${categoryInstruction}
                
                Return ONLY JSON. For groupName use an existing category or suggest one (e.g. design tool → "Design", productivity → "Productivity"). Use "No group" only if truly uncategorizable:
                {
                    "newNodeDescription": "Brief description",
                    "groupName": "Design",
                    "connections": [
                        { "id": "Neuron Name", "accuracy": 95 }
                    ]
                }
            `;

            let text = "";
            try {
                const result = await model.generateContent(prompt);
                text = cleanJsonString(result.response.text());
            } catch (err) {
                const rate = isRateLimitError(err);
                if (rate) {
                    return NextResponse.json(
                        { error: 'RATE_LIMIT', retryAfterSeconds: rate.retryAfterSeconds ?? 40 },
                        { status: 429 }
                    );
                }
                throw err;
            }
            
            try {
                const parsed = JSON.parse(text);
                const groupId = await resolveOrCreateGroupId(parsed.groupName, groups, user.id, supabase);
                return NextResponse.json({
                    description: parsed.newNodeDescription || "",
                    connections: (parsed.connections || []).filter((c: any) => c.accuracy >= 80),
                    group_id: groupId,
                });
            } catch (e) {
                console.error("🔴 Failed to parse Gemini JSON:", text);
                return NextResponse.json({});
            }
        }

        if (mode === 'analyze_link') {
            const newTitle = newNode.id || newNode.title || '';
            const newUrl = newNode.url || '';
            const newContent = newNode.content || '';
            const existingEntries = (existingNodes || []).map((s: string) => {
                const bar = s.indexOf(' | ');
                return bar >= 0 ? { id: s.slice(0, bar).trim(), line: s } : { id: String(s).trim(), line: String(s) };
            });
            const existingIds = existingEntries.map((e: { id: string }) => e.id).filter(Boolean);
            const existingListDisplay = existingEntries.map((e: { line: string }) => e.line).join('\n');
            const prompt = `
                You are a semantic graph architect.

                NEW NEURON TO CLASSIFY:
                - TITLE: "${newTitle}"
                - URL: ${newUrl || '(none)'}
                - CONTENT/SUMMARY: ${typeof newContent === 'string' ? newContent.slice(0, 500) : '(none)'}

                EXISTING LIST (each line is "id | url" for context; when you return a connection, use only the exact "id" part before " | "):
                ${existingListDisplay}

                TASK:
                1. Find up to 3 connections from the EXISTING LIST. In "connections", each "id" must be EXACTLY the id part (the text before " | " on each line above). If no 80%+ match, return empty array.
                2. ${categoryInstruction}

                Return JSON. For groupName use an existing category or suggest one from the link (e.g. Canva/Figma → "Design", Notion → "Productivity"). Use "No group" only if truly uncategorizable:
                {
                    "summary": "1-sentence context",
                    "tags": ["tag1", "tag2"],
                    "groupName": "Design",
                    "connections": [
                        { "id": "Exact string from the list", "accuracy": 90 }
                    ]
                }
            `;

            let text = "";
            try {
                const result = await model.generateContent(prompt);
                text = cleanJsonString(result.response.text());
            } catch (err) {
                const rate = isRateLimitError(err);
                if (rate) {
                    return NextResponse.json(
                        { error: 'RATE_LIMIT', retryAfterSeconds: rate.retryAfterSeconds ?? 40 },
                        { status: 429 }
                    );
                }
                throw err;
            }
            
            try {
                const parsed = JSON.parse(text);
                const groupId = await resolveOrCreateGroupId(parsed.groupName, groups, user.id, supabase);
                const idSet = new Set(existingIds);
                const connections = (parsed.connections || [])
                    .filter((c: any) => c.accuracy >= 80 && c.id != null && idSet.has(String(c.id).trim()));
                return NextResponse.json({
                    summary: parsed.summary || "",
                    tags: parsed.tags || [],
                    connections,
                    group_id: groupId,
                });
            } catch (e) {
                console.error("🔴 Failed to parse Gemini JSON (analyze_link):", text?.slice?.(0, 200));
                return NextResponse.json({
                    summary: newNode.url,
                    tags: [],
                    connections: [],
                    group_id: null,
                });
            }
        }

    } catch (error: any) {
        console.error("🔴 SERVER ERROR IN AI ROUTE:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}