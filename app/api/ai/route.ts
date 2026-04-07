import OpenAI from "openai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = body?.input;

    if (!input || typeof input !== "string") {
      return Response.json(
        { error: "Missing or invalid input" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return Response.json({
        error: "OpenAI key not configured",
        fallback: true
      });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const response = await client.responses.create({
      model,
      input
    });

    return Response.json({
      reply: response.output_text || "No response returned."
    });
  } catch (error) {
    console.error("AI route error:", error);

    return Response.json(
      { error: "Failed to generate AI response" },
      { status: 500 }
    );
  }
}