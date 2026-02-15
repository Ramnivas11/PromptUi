import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_INSTRUCTION = `You are an expert React and Tailwind CSS developer.
Your task is to generate a single, self-contained React functional component based on the user's description.

STRICT RULES — you MUST follow every one:
1. Return ONLY the raw JSX/JavaScript code. Do NOT wrap it in markdown code fences (\`\`\`).
2. Do NOT include any conversational text, explanations, or comments outside the code.
3. The component MUST start with: import React from 'react';
4. If icons are needed, import them from 'lucide-react' (e.g. import { Star, Check } from 'lucide-react';).
5. Do NOT import any other external libraries (internal icons/components are not available).
6. The component MUST be exported as: export default function App() { ... }
7. Use Tailwind CSS utility classes for ALL styling. Do NOT use inline style objects or CSS modules.
8. Make the component visually impressive, modern, and fully responsive.
9. Use realistic placeholder content (names, prices, descriptions) — never use "Lorem ipsum".
10. Include interactive states like hover effects and transitions using Tailwind classes.
11. Do NOT use React hooks like useState or useEffect UNLESS absolutely necessary for simple interactivity (like a counter or toggle). Focus on pure UI.`;

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "A valid prompt string is required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    // Retry logic (Max 3 attempts)
    let attempt = 0;
    const maxRetries = 3;
    let lastError: unknown = null;

    while (attempt < maxRetries) {
      try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        let code = response.text();

        // Strip markdown fences
        code = code
          .replace(/^```(?:jsx|javascript|tsx|js|react)?\s*\n?/i, "")
          .replace(/\n?```\s*$/i, "")
          .trim();

        return NextResponse.json({ code });
      } catch (error: unknown) {
        console.error(`Attempt ${attempt + 1} failed:`, error);
        lastError = error;

        // Check if it's a rate limit
        const isRateLimit =
          (error instanceof Error && error.message.includes("429")) ||
          (typeof error === "object" &&
            error !== null &&
            "status" in error &&
            (error as Record<string, unknown>).status === 429);

        if (isRateLimit && attempt < maxRetries - 1) {
          // Wait before retrying (exponential backoff: 2s, 4s, 8s)
          const delay = Math.pow(2, attempt + 1) * 1000;
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          attempt++;
          continue;
        }

        // If not rate limit or max retries reached, break
        break;
      }
    }

    // Handled exhausted retries or non-retriable error
    throw lastError;

  } catch (error: unknown) {
    console.error("Gemini API error (Final):", error);

    // Check for 429 specifically
    const isRateLimit =
      (error instanceof Error && error.message.includes("429")) ||
      (typeof error === "object" &&
        error !== null &&
        "status" in error &&
        (error as Record<string, unknown>).status === 429);

    if (isRateLimit) {
      return NextResponse.json(
        {
          error:
            "High traffic. Please try again in 10-15 seconds (Rate Limit Exceeded).",
          isRateLimit: true,
        },
        { status: 429 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
