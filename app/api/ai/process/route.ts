/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Допоміжна функція для очищення тексту від можливих маркдаун-тегів OpenAI/Gemini
function cleanJsonString(str: string) {
    return str.replace(/```json/g, "").replace(/```/g, "").trim();
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
                
                Return ONLY JSON:
                {
                    "newNodeDescription": "Brief description",
                    "connections": [
                        { "id": "Neuron Name", "accuracy": 95 }
                    ]
                }
            `;

            const result = await model.generateContent(prompt);
            const text = cleanJsonString(result.response.text());
            
            try {
                const parsed = JSON.parse(text);
        
                return NextResponse.json({
                    description: parsed.newNodeDescription || "",
                    connections: (parsed.connections || []).filter((c: any) => c.accuracy >= 80)
                });
            } catch (e) {
                console.error("🔴 Failed to parse Gemini JSON:", text);
                return NextResponse.json([]);
            }
        }

        if (mode === 'analyze_link') {
            const prompt = `
                You are a semantic graph architect.
    
                NEW NEURON: "${newNode.id || newNode.title}"
                EXISTING LIST: ${existingNodes.join(', ')}

                TASK:
                Find up to 3 connections from the EXISTING LIST.
                
                IMPORTANT:
                In the "connections" array, the "id" must be EXACTLY one of the strings provided in the EXISTING LIST.
                If no high-confidence (80%+) match is found, return an empty array.

                Return JSON:
                {
                    "summary": "1-sentence context",
                    "tags": ["tag1", "tag2"],
                    "connections": [
                        { "id": "Exact string from the list", "accuracy": 90 }
                    ]
                }
            `;

            const result = await model.generateContent(prompt);
            const text = cleanJsonString(result.response.text());
            
            try {
                const parsed = JSON.parse(text);
                return NextResponse.json({
                    summary: parsed.summary || "",
                    tags: parsed.tags || [],
                    connections: (parsed.connections || []).filter((c: any) => c.accuracy >= 80)
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