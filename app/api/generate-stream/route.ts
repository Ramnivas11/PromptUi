import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

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
11. Do NOT use React hooks like useState or useEffect UNLESS absolutely necessary for simple interactivity (like a counter or toggle). Focus on pure UI.
12. Put ALL code in a single file. Do NOT split into multiple files or components that import from other local files.
13. Define any sub-components (e.g. Card, Section) in the same file before the main App component.`;

// Cached model instance
let cachedModel: ReturnType<InstanceType<typeof GoogleGenerativeAI>["getGenerativeModel"]> | null = null;

function getModel() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    if (!cachedModel) {
        const genAI = new GoogleGenerativeAI(apiKey);
        cachedModel = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: SYSTEM_INSTRUCTION,
        });
    }
    return cachedModel;
}

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { prompt, previousCode, refinement } = body;

        // Build the actual prompt text
        let userPrompt: string;
        if (previousCode && refinement) {
            userPrompt = `Here is the current React component code:\n\n${previousCode}\n\nThe user wants the following changes:\n${refinement}\n\nPlease return the complete updated code with these changes applied. Keep everything in a single file.`;
        } else if (prompt && typeof prompt === "string") {
            userPrompt = prompt.trim().slice(0, 4000);
        } else {
            return new Response(
                JSON.stringify({ error: "A valid prompt string is required." }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const model = getModel();
        if (!model) {
            return new Response(
                JSON.stringify({ error: "GEMINI_API_KEY is not configured on the server." }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        // Stream via SSE
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                let closed = false;

                const safeSend = (data: string) => {
                    if (closed) return;
                    try {
                        controller.enqueue(encoder.encode(data));
                    } catch {
                        closed = true;
                    }
                };

                const safeClose = () => {
                    if (closed) return;
                    closed = true;
                    try {
                        controller.close();
                    } catch {
                        // Already closed
                    }
                };

                let attempt = 0;
                const maxRetries = 3;

                while (attempt < maxRetries) {
                    try {
                        const result = await model.generateContentStream(userPrompt);

                        for await (const chunk of result.stream) {
                            const text = chunk.text();
                            if (text) {
                                safeSend(`data: ${JSON.stringify({ text })}\n\n`);
                            }
                        }

                        safeSend(`data: [DONE]\n\n`);
                        safeClose();
                        return;
                    } catch (error: unknown) {
                        console.error(`Stream attempt ${attempt + 1} failed:`, error);

                        const isRateLimit =
                            (error instanceof Error && error.message.includes("429")) ||
                            (typeof error === "object" &&
                                error !== null &&
                                "status" in error &&
                                (error as Record<string, unknown>).status === 429);

                        if (isRateLimit && attempt < maxRetries - 1) {
                            const delay = Math.pow(2, attempt + 1) * 1000;
                            await new Promise((resolve) => setTimeout(resolve, delay));
                            attempt++;
                            continue;
                        }

                        const message =
                            isRateLimit
                                ? "High traffic. Please try again in 10-15 seconds (Rate Limit Exceeded)."
                                : error instanceof Error
                                    ? error.message
                                    : "Internal server error";

                        safeSend(`data: ${JSON.stringify({ error: message, isRateLimit })}\n\n`);
                        safeClose();
                        return;
                    }
                }

                safeClose();
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        });
    } catch (error: unknown) {
        console.error("Stream setup error:", error);
        const message =
            error instanceof Error ? error.message : "Internal server error";
        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
