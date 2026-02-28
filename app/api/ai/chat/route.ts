import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_PROMPT = `You are the Nervia Neural Core. Use the provided context from the user's personal knowledge base to answer the question. If the answer is not in the context, say so, but try to find connections. Be concise and insightful.`;

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
        ? "(No relevant context from the knowledge base.)"
        : validNodes
            .map(
              (n) =>
                `- Title: ${(n.title || "").slice(0, 200)}\n  Summary: ${(n.summary || "").slice(0, 400)}\n  Tags: ${(n.tags || []).join(", ")}`
            )
            .join("\n\n");

    const prompt = `${SYSTEM_PROMPT}

CONTEXT FROM KNOWLEDGE BASE:
${contextBlock}

QUESTION: ${userQuestion.trim()}

Answer based on the context above. If the answer is not in the context, say so and suggest connections if you can.`;

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
