import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_PROMPT = `You are the Nervia Exocortex, an advanced AI neural network designed to help the user think better, find hidden connections, and expand their personal knowledge base (called "universe").
- You are analyzing a specific "neuron" (a note, link, or idea).
- Do not use generic pleasantries (e.g., "Sure, I can help with that"). Dive straight into the analysis.
- Use clean Markdown formatting (bolding, bullet points) to make your response easy to scan.
- If the content is too brief, deduce potential meanings based on the title and tags.
- Be concise, insightful, and highly analytical.`;

export interface ChatContextNode {
  title: string;
  summary: string;
  tags: string[];
}

export interface ChatRequestBody {
  userQuestion: string;
  contextNodes: ChatContextNode[];
}

export interface ChatResponseBody {
  reply: string;
}

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     description: Chat with the Nervia Neural Core using context from the user's knowledge base. Answers based on provided context nodes.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userQuestion, contextNodes]
 *             properties:
 *               userQuestion:
 *                 type: string
 *               contextNodes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     summary:
 *                       type: string
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *     responses:
 *       200:
 *         description: Reply from the neural core.
 *       400:
 *         description: userQuestion or contextNodes missing or invalid.
 *       500:
 *         description: API key missing or chat failed.
 */
export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is missing in .env.local");
      return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    }

    const body = (await req.json()) as ChatRequestBody;
    const { userQuestion, contextNodes } = body;

    if (typeof userQuestion !== "string" || !userQuestion.trim()) {
      return NextResponse.json(
        { error: "userQuestion is required and must be a non-empty string" },
        { status: 400 }
      );
    }
    if (!Array.isArray(contextNodes)) {
      return NextResponse.json(
        { error: "contextNodes must be an array" },
        { status: 400 }
      );
    }

    const validNodes = contextNodes.filter(
      (n): n is ChatContextNode =>
        n != null &&
        typeof n.title === "string" &&
        typeof n.summary === "string" &&
        Array.isArray(n.tags)
    );

    const contextBlock =
      validNodes.length === 0
        ? "(No relevant content provided.)"
        : validNodes
            .map(
              (n) =>
                `--- NEURON START ---\nTitle: ${(n.title || "").slice(0, 300)}\nContent: ${(n.summary || "").slice(0, 5000)}\nTags: ${(n.tags || []).join(", ")}\n--- NEURON END ---`
            )
            .join("\n\n");

    const prompt = `${SYSTEM_PROMPT}\n\nTARGET DATA FOR ANALYSIS:\n${contextBlock}\n\nUSER DIRECTIVE:\n${userQuestion.trim()}`;

    const model = genAI.getGenerativeModel({ model: "gemma-3-27b-it" });
    const result = await model.generateContent(prompt);
    const reply = result.response.text()?.trim() ?? "I couldn't generate a reply.";

    return NextResponse.json({ reply } satisfies ChatResponseBody);
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Chat failed" },
      { status: 500 }
    );
  }
}
