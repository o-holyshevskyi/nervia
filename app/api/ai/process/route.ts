/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Допоміжна функція для очищення тексту від можливих маркдаун-тегів OpenAI/Gemini
function cleanJsonString(str: string) {
    return str.replace(/```json/g, "").replace(/```/g, "").trim();
}

// Semantic groups for graph clustering (same as GraphNetwork groupNames)
const GROUP_DEF = "1=Development/Tech, 2=AI/ML, 3=Finance/Business, 4=Design/Creative, 5=Research/Education";

function validGroup(value: unknown): number | undefined {
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) && n >= 1 && n <= 5 ? n : undefined;
}

export async function POST(req: Request) {
    try {
        // Перевірка ключа (якщо його немає, сервер видасть 500 з цим повідомленням)
        if (!process.env.GEMINI_API_KEY) {
            console.error("🔴 GEMINI_API_KEY is missing in .env.local");
            return NextResponse.json({ error: "API Key missing" }, { status: 500 });
        }

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
                - Assign the NEW neuron to exactly one semantic group: ${GROUP_DEF}. Output "group" as a single number 1, 2, 3, 4, or 5 that best fits the neuron's topic.
                
                Return ONLY JSON (use a real number 1-5 for "group", not a placeholder):
                {
                    "newNodeDescription": "Brief description",
                    "group": 2,
                    "connections": [
                        { "id": "Neuron Name", "accuracy": 95 }
                    ]
                }
            `;

            const result = await model.generateContent(prompt);
            const text = cleanJsonString(result.response.text());
            
            try {
                const parsed = JSON.parse(text);
                const group = validGroup(parsed.group);
                return NextResponse.json({
                    description: parsed.newNodeDescription || "",
                    connections: (parsed.connections || []).filter((c: any) => c.accuracy >= 80),
                    ...(group !== undefined && { group }),
                });
            } catch (e) {
                console.error("🔴 Failed to parse Gemini JSON:", text);
                return NextResponse.json([]);
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
                2. Assign this neuron to exactly one semantic group: ${GROUP_DEF}. You MUST choose based on URL and content: e.g. developer/app/tech URLs → 1, AI/ML tools → 2, finance/taxes/invoicing → 3, design/canva/visual → 4, education/research → 5. Output "group" as a single number 1-5. Do not default to 1; pick the best fit.

                Return JSON (use a real number 1-5 for "group"):
                {
                    "summary": "1-sentence context",
                    "tags": ["tag1", "tag2"],
                    "group": 2,
                    "connections": [
                        { "id": "Exact string from the list", "accuracy": 90 }
                    ]
                }
            `;

            const result = await model.generateContent(prompt);
            const text = cleanJsonString(result.response.text());
            
            try {
                const parsed = JSON.parse(text);
                const group = validGroup(parsed.group);
                const idSet = new Set(existingIds);
                const connections = (parsed.connections || [])
                    .filter((c: any) => c.accuracy >= 80 && c.id != null && idSet.has(String(c.id).trim()));
                return NextResponse.json({
                    summary: parsed.summary || "",
                    tags: parsed.tags || [],
                    connections,
                    ...(group !== undefined && { group }),
                });
            } catch (e) {
                return NextResponse.json({ summary: newNode.url, tags: [], connections: [] });
            }
        }

    } catch (error: any) {
        console.error("🔴 SERVER ERROR IN AI ROUTE:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}