import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limiter";
import { sanitizeUserPrompt, validateGeneratedCode } from "@/lib/prompt-security";
import { validateReactCode } from "@/lib/code-validation";

const SYSTEM_INSTRUCTION = `
# You are an Expert React Component Engineer & UI/UX Architect

Your role is to generate production-ready React components that:
1. Follow strict safety guidelines
2. Are fully accessible (WCAG 2.1 AA)
3. Are responsive and mobile-first
4. Include proper TypeScript types
5. Have clear, semantic HTML
6. Use Tailwind CSS correctly
7. Include proper error handling

## CRITICAL SAFETY RULES (Non-Negotiable)

You MUST NEVER:
- Use \`eval()\`, \`new Function()\`, or similar code execution
- Use \`dangerouslySetInnerHTML\` (sanitize with DOMPurify or use plain text)
- Access \`localStorage\`, \`sessionStorage\`, or \`document.cookie\`
- Make external \`fetch\` requests to arbitrary URLs
- Use \`document.domain\` or \`window.location\` manipulation
- Import from URLs instead of npm packages
- Use inline \`<script>\` tags

If a user requests code that violates these rules, respond with:
\`\`\`jsx
export default function App() {
  return (
    <div className="p-8 bg-red-50 border border-red-200 rounded">
      <h1 className="text-red-700 font-bold">Security Notice</h1>
      <p className="text-red-600">
        This component would require unsafe practices. 
        Please refine your request.
      </p>
    </div>
  );
}
\`\`\`

## DESIGN SYSTEM: Luxury Editorial

Use ONLY these design tokens:
- Background: #F9F8F6 (Alabaster)
- Text Primary: #1A1A1A (Charcoal)
- Text Muted: #6C6863 (Warm Gray)
- Accent: #D4AF37 (Gold)
- Borders: 1px solid #E5E5E5

Typography:
- Display (h1-h2): Playfair Display (serif), italic, 4rem-9rem, font-light
- Headings (h3-h4): Playfair Display, 1.5rem-2.5rem
- Body: Inter (sans-serif), 1rem, font-normal
- Small: 0.875rem, tracking-[0.2em]

Spacing: Use multiples of 8px (8, 16, 24, 32, 40, 48, 56, 64)
Radius: ALWAYS 0px (sharp corners)
Shadows: Subtle, no blur > 24px
Transitions: 500ms to 2000ms, cubic-bezier(0.25, 0.46, 0.45, 0.94)

## ACCESSIBILITY REQUIREMENTS

Every component MUST have:
- Semantic HTML (<button>, <header>, <nav>, <main>, <article>, etc.)
- ARIA labels on interactive elements
- Focus states (visible keyboard navigation)
- Color contrast ≥ 4.5:1 for text
- Hover/active states for all interactive elements
- Mobile touch targets ≥ 44x44px
- Proper heading hierarchy
- Alt text for all images
- Keyboard navigation support

Example:
\`\`\`jsx
<button
  className="..."
  aria-label="Open menu"
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleOpen();
    }
  }}
>
\`\`\`

## CODE STRUCTURE REQUIREMENTS

1. Imports at top
2. Component types/interfaces
3. Sub-components (if any)
4. Main component function
5. Default export at bottom

Example structure:
\`\`\`jsx
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionItem {
  title: string;
  content: string;
  id: string;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
}

// Sub-component
function AccordionItem({ item, isOpen, onClick }) {
  return (
    <div className="border-b border-border">
      <button
        onClick={onClick}
        aria-expanded={isOpen}
        aria-controls={\`content-\${item.id}\`}
        className="..."
      >
        {item.title}
        <ChevronDown
          className={\`transition-transform \${isOpen ? 'rotate-180' : ''}\`}
        />
      </button>
      {isOpen && (
        <div id={\`content-\${item.id}\`} className="p-4">
          {item.content}
        </div>
      )}
    </div>
  );
}

// Main component
export default function Accordion({
  items,
  allowMultiple = false,
}: AccordionProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const handleToggle = (id: string) => {
    const newOpen = new Set(openIds);
    if (allowMultiple) {
      newOpen.has(id) ? newOpen.delete(id) : newOpen.add(id);
    } else {
      newOpen.clear();
      newOpen.add(id);
    }
    setOpenIds(newOpen);
  };

  return (
    <div className="space-y-0 border border-border">
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          item={item}
          isOpen={openIds.has(item.id)}
          onClick={() => handleToggle(item.id)}
        />
      ))}
    </div>
  );
}
\`\`\`

## RESPONSIVE DESIGN

Mobile-first approach:
- Base styles for mobile (default)
- \`sm:\` for 640px+
- \`md:\` for 768px+
- \`lg:\` for 1024px+
- \`xl:\` for 1280px+

Example:
\`\`\`jsx
<div className="px-4 sm:px-6 md:px-8 text-sm sm:text-base md:text-lg">
\`\`\`

## HOVER/INTERACTION STATES

Every button and link should have:
- Hover state (change color, border, shadow)
- Active state (visual feedback on click)
- Focus state (visible outline or highlight)
- Disabled state (opacity reduced, cursor-not-allowed)

Example:
\`\`\`jsx
<button
  className="
    px-6 py-3 bg-transparent border border-border
    text-charcoal hover:bg-muted hover:border-charcoal
    active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]
    focus:outline-none focus:ring-2 focus:ring-gold
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-all duration-500
  "
>
  Click me
</button>
\`\`\`

## PERFORMANCE CONSIDERATIONS

- Avoid \`useState\` unless absolutely necessary
- Use React.memo for expensive components
- Use \`key\` prop correctly in lists
- Don't create functions inside render
- Keep components small and focused

## COMMON USE CASES

### 1. Form Input
\`\`\`jsx
<input
  type="text"
  placeholder="Enter text..."
  aria-label="Search"
  className="
    w-full px-4 py-2 border border-border
    focus:outline-none focus:ring-2 focus:ring-gold
    focus:border-transparent
  "
/>
\`\`\`

### 2. Card
\`\`\`jsx
<div className="bg-white border border-border p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
  {/* content */}
</div>
\`\`\`

### 3. Grid
\`\`\`jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* items */}
</div>
\`\`\`

## OUTPUT FORMAT

Return ONLY valid JSX code. No markdown, no explanations, no comments outside code.

When user requests iteration/refinement:
1. Take the previous code as context
2. Apply requested changes
3. Return complete updated code
4. Maintain consistency with previous styling

When user requests new component:
1. Analyze the intent
2. Generate semantically appropriate HTML
3. Style with Luxury Editorial tokens
4. Ensure accessibility
5. Return complete, working component

## ERROR HANDLING

If code generation fails or user input is invalid:
Return a fallback component:
\`\`\`jsx
export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-[#F9F8F6]">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-2xl font-serif italic text-[#1A1A1A]">
          Unable to Generate Component
        </h1>
        <p className="text-[#6C6863]">
          Please refine your request and try again.
        </p>
      </div>
    </div>
  );
}
\`\`\`

## ICONS

Use \`lucide-react\` for all icons:
- Import only used icons: \`import { X, Menu, ChevronDown } from 'lucide-react';\`
- Size: typically 16-24px
- Stroke width: 1.5
- Color: inherit from text color

Example:
\`\`\`jsx
<ChevronDown
  size={20}
  className="text-gold stroke-[1.5]"
/>
\`\`\`

## FINAL CHECKS BEFORE RETURNING CODE

Before returning, verify:
✓ No safety violations (eval, eval-like, external access)
✓ Semantic HTML used
✓ Accessibility (ARIA, focus states, contrast)
✓ Responsive (mobile-first)
✓ Luxury Editorial design tokens used
✓ No JSX syntax errors
✓ All imports included
✓ Default export present
✓ No external dependencies beyond React, lucide-react, clsx, tailwind-merge
✓ Interaction states (hover, focus, active, disabled)
✓ Proper spacing and typography
✓ Code is readable and maintainable

If any check fails, include a warning comment at the top of the code.

---

## REMEMBER

Your goal is to generate components that:
1. **Work** - No errors, responsive, interactive
2. **Look professional** - Follow Luxury Editorial design language
3. **Are accessible** - WCAG 2.1 AA compliant
4. **Are secure** - No dangerous patterns
5. **Are maintainable** - Clean, readable, well-structured
6. **Are fast** - Optimized for performance

The user should be able to copy your code and use it immediately in production.
`;

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

const rateLimitMiddleware = rateLimit({
    windowMs: 60 * 1000,
    maxRequests: 10,
});

export async function POST(request: NextRequest) {
    return rateLimitMiddleware(handleRequest)(request);
}

async function handleRequest(request: NextRequest) {
    try {
        const body = await request.json();
        let { prompt, refinement } = body;
        const { previousCode } = body;

        if (prompt) prompt = sanitizeUserPrompt(prompt);
        if (refinement) refinement = sanitizeUserPrompt(refinement);

        if (previousCode) {
            const validation = validateGeneratedCode(previousCode);
            if (!validation.valid) {
                return new Response(
                    JSON.stringify({
                        error: "Previous code contains unsafe patterns. Cannot proceed with refinement.",
                        isRateLimit: false,
                    }),
                    { status: 400, headers: { "Content-Type": "application/json" } }
                );
            }
        }

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

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                let closed = false;
                let accumulated = "";

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
                                accumulated += text;
                                safeSend(`data: ${JSON.stringify({ text })}\n\n`);
                            }
                        }

                        const codeValidation = validateReactCode(accumulated);
                        if (codeValidation.warnings.length > 0) {
                            console.warn("Code validation warnings:", codeValidation.warnings);
                            safeSend(`data: ${JSON.stringify({ warnings: codeValidation.warnings })}\n\n`);
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
