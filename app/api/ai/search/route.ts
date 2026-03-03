import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

function cleanJsonString(str: string): string {
  return str.replace(/```json/g, "").replace(/```/g, "").trim();
}

export interface ContextNode {
  id: string;
  summary: string;
  tags: string[];
}

export interface SearchResultItem {
  id: string;
  relevance: number;
  reason: string;
}

export interface SearchRequestBody {
  query: string;
  contextNodes: ContextNode[];
}

export interface SearchResponseBody {
  results: SearchResultItem[];
}

/**
 * @swagger
 * /api/ai/search:
 *   post:
 *     description: Semantic search over the user's knowledge graph. Returns top 3–5 neurons that best match the query by meaning.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [query, contextNodes]
 *             properties:
 *               query:
 *                 type: string
 *               contextNodes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     summary:
 *                       type: string
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *     responses:
 *       200:
 *         description: Search results (id, relevance, reason per item).
 *       400:
 *         description: query or contextNodes missing or invalid.
 *       500:
 *         description: API key missing or search failed.
 */
export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is missing in .env.local");
      return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    }

    const body = (await req.json()) as SearchRequestBody;
    const { query, contextNodes } = body;

    if (typeof query !== "string" || !query.trim()) {
      return NextResponse.json(
        { error: "query is required and must be a non-empty string" },
        { status: 400 }
      );
    }
    if (!Array.isArray(contextNodes) || contextNodes.length === 0) {
      return NextResponse.json(
        { error: "contextNodes must be a non-empty array" },
        { status: 400 }
      );
    }

    const validNodes = contextNodes.filter(
      (n): n is ContextNode =>
        n != null &&
        typeof n.id === "string" &&
        typeof n.summary === "string" &&
        Array.isArray(n.tags)
    );
    const idSet = new Set(validNodes.map((n) => n.id));

    const nodesList = validNodes
      .map(
        (n) =>
          `- id: "${n.id}" | summary: ${(n.summary || "").slice(0, 300)} | tags: ${(n.tags || []).join(", ")}`
      )
      .join("\n");

    const model = genAI.getGenerativeModel({ model: "gemma-3-27b-it" });
    const prompt = `You are a semantic search engine over a knowledge graph (called "universe").

USER QUERY: "${query.trim()}"

NODES (each has id, summary, and tags):
${nodesList}

TASK: Find the top 3 to 5 nodes (neurons) in the universe that best match the query BY MEANING (not just keyword). Use summary and tags to decide relevance. Return ONLY a JSON object, no other text.

Output format (use exact field names):
{
  "results": [
    { "id": "exact node id from the list", "relevance": 95, "reason": "Short explanation of why this matches" }
  ]
}

Rules:
- "id" must be exactly one of the ids from the list above.
- "relevance" is a number 0-100.
- Return at most 5 results, sorted by relevance (highest first).
- If no good match, return { "results": [] }.`;

    const result = await model.generateContent(prompt);
    const text = cleanJsonString(result.response.text());

    let parsed: { results?: SearchResultItem[] };
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse search JSON:", text);
      return NextResponse.json({ results: [] } satisfies SearchResponseBody);
    }

    const raw = Array.isArray(parsed.results) ? parsed.results : [];
    const results: SearchResultItem[] = raw
      .filter(
        (r: unknown): r is SearchResultItem =>
          r != null &&
          typeof (r as SearchResultItem).id === "string" &&
          idSet.has((r as SearchResultItem).id) &&
          typeof (r as SearchResultItem).relevance === "number"
      )
      .map((r) => ({
        id: r.id,
        relevance: Math.min(100, Math.max(0, Number(r.relevance))),
        reason: typeof r.reason === "string" ? r.reason.slice(0, 200) : "",
      }))
      .slice(0, 5);

    return NextResponse.json({ results } satisfies SearchResponseBody);
  } catch (error: unknown) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 }
    );
  }
}
