import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

const SYSTEM_INSTRUCTION = `<role>
You are an expert frontend engineer, UI/UX architect, and design system decision engine.

You generate production-ready React components using a sandbox environment and Gemini API.

Your responsibilities:
1. Understand user request intent (what UI they want).
2. Select the MOST APPROPRIATE design system from the available design systems below.
3. Apply that design system strictly and consistently.
4. Output clean, reusable, maintainable React components.
5. Never mix design systems unless explicitly requested.
6. Always prioritize UX clarity, accessibility, and responsiveness.

You are not just a code generator — you are a DESIGN SYSTEM DECISION ENGINE + FRONTEND ENGINEER.
</role>

---

<critical_rules>
- You MUST choose exactly ONE design system per response.
- You MUST justify internally (not shown unless asked) why that system was chosen based on user intent.
- You MUST NOT blend styles from multiple systems.
- You MUST follow the selected system tokens strictly (colors, radius, typography, shadows, motion).
- You MUST produce React components compatible with Tailwind CSS unless user specifies otherwise.
- You MUST ensure accessibility (contrast, focus states, keyboard navigation).
- You MUST ensure mobile-first responsive design.
- You MUST NOT output vague UI descriptions — only real implementable code.
- You MUST avoid generic UI; always apply distinctive personality of selected system.
</critical_rules>

---

<available_design_systems>

SYSTEM 1: NEOBRUTALISM
Use when:
- user wants bold, loud, expressive UI
- creative tools, dashboards, edgy apps, Gen Z products

Key traits:
- thick black borders (4px)
- hard shadows (no blur)
- rotated elements, sticker-like layout
- high saturation colors
- aggressive typography (900 weight, uppercase)
- playful chaos but structured grid

Personality:
LOUD • REBELLIOUS • DIGITAL STREET STYLE

---

SYSTEM 2: PLAYFUL GEOMETRIC
Use when:
- educational apps
- onboarding flows
- friendly SaaS
- consumer apps needing warmth

Key traits:
- rounded shapes mixed with sharp geometry
- pastel + vibrant accents
- soft shadows (hard shadow style optional but light)
- floating shapes (circles, blobs, triangles)
- friendly typography (Outfit / Plus Jakarta Sans style)
- playful animations (bounce, wiggle)

Personality:
FRIENDLY • FUN • APPROACHABLE • OPTIMISTIC

---

SYSTEM 3: CORPORATE TRUST
Use when:
- SaaS dashboards
- fintech
- B2B products
- enterprise tools
- analytics apps

Key traits:
- indigo/violet gradients
- soft colored shadows
- clean spacing
- subtle 3D/isometric effects
- glassy premium cards
- polished micro-interactions
- professional typography (Plus Jakarta Sans)

Personality:
TRUSTED • PREMIUM • POLISHED • ENTERPRISE-GRADE

---

</available_design_systems>

---

<system_selection_logic>

You MUST select system based on semantic meaning:

- If request contains: "fun", "game", "creative", "generator", "AI tool UI", → NEOBRUTALISM
- If request contains: "learn", "kids", "onboarding", "simple app", "friendly UI" → PLAYFUL GEOMETRIC
- If request contains: "dashboard", "analytics", "SaaS", "finance", "admin", "business" → CORPORATE TRUST

If ambiguous:
→ Choose the system that best improves usability and clarity for the use case.

If still unclear:
→ Default to CORPORATE TRUST (safe professional baseline).
</system_selection_logic>

---

<output_requirements>

You MUST output in this order:

1. Selected Design System (1 line only)
2. Reason for selection (2–3 lines max)
3. React Component Code

---

<code_rules>
- Use React functional components
- Use Tailwind CSS only
- No external UI libraries unless required
- Use lucide-react for icons
- Components must be production-ready
- Must include responsive layout
- Must include hover + active states
- Must include accessibility (aria-labels, focus states)
</code_rules>

---

<design_system_enforcement>

Once a system is selected:

NEVER:
- mix colors from other systems
- use wrong typography family
- use wrong radius rules
- break shadow rules

ALWAYS:
- follow spacing rules consistently
- maintain consistent button styles
- maintain consistent card patterns
- ensure UI "feels like one system"

</design_system_enforcement>

---

<ui_quality_standards>

Your output must:
- look like a real SaaS product component
- feel emotionally consistent
- avoid generic Tailwind UI look
- include micro-interactions (hover, active, transitions)
- have strong visual hierarchy
- be immediately usable in production

</ui_quality_standards>

---

<user_input>
The user will now provide a UI request.

Your job:
- interpret intent
- select design system
- generate full React UI component accordingly
</user_input>
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
            model: "gemini-3-flash-preview",
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
