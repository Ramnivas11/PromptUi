# PromptUI

PromptUI is a premium, AI-driven component editor, generator, and sandbox playground built with Next.js, Tailwind CSS, and Sandpack. It enables developers and designers to build luxury, editorial-grade web interfaces instantly using natural language prompts, featuring real-time preview and an automated AI error recovery system.

---

## Key Features

- **Streaming AI Generation:** Generates UI components instantly with Server-Sent Events (SSE) for smooth, interactive generation.
- **Embedded Sandbox Previews:** Employs `@codesandbox/sandpack-react` to run and interact with generated components in a sandboxed iframe.
- **Auto-Fix Loop:** Detects compiler/runtime errors inside the sandbox and triggers an automatic AI-feedback correction routine (up to 3 times) to fix the code without manual intervention.
- **Luxury Editorial Design Guidelines:** Standardizes generated layouts using beautiful aesthetics—alabaster backgrounds, charcoal text, gold accents, spacious margins, clean typography (serif/sans-serif combination), and elegant micro-animations.
- **Local History & Quota Guard:** Caches generation history and inputs locally via custom `StorageManager` safeguards against disk space limits.
- **Dynamic Layout:** Features a customizable desktop schematic with resizable panels for code generation, prompt controls, and runtime preview.

---

## Project Structure

```bash
├── app/
│   ├── api/
│   │   └── generate-stream/      # SSE API endpoint for LLM generation
│   ├── layout.tsx                # App shell, fonts, and external analytics integration
│   └── page.tsx                  # Main workspace container and state management
├── components/
│   ├── prompt/
│   │   └── prompt-form.tsx       # Prompt entry, submit, status, and iterative toggle
│   ├── preview/
│   │   └── preview-panel.tsx     # Code view, Sandpack instance, copy, and error tracking
│   ├── sidebar/
│   │   └── history-sidebar.tsx   # Locally cached prompt history explorer
│   └── ui/                       # Reusable visual components (Toast, Resizable panels, etc.)
├── lib/
│   ├── parse-multi-file.ts       # Parses LLM outputs and strips code blocks safely
│   ├── storage-manager.ts        # Manages localStorage quotas and safety fallbacks
│   └── stream-parser.ts          # Handles streaming response chunks safely
├── public/                       # Static assets
└── tailwind.config.ts            # Custom design tokens (editorial fonts, HSL palettes)
```

---

## Getting Started

### Prerequisites

- Node.js (v18.x or later recommended)
- npm, yarn, or pnpm

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Ramnivas11/PromptUi.git
   cd PromptUi
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   # API keys/endpoint configurations for the generation service
   API_KEY=your-api-key-here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Content Security Policy (CSP) & Sandbox

To maintain production security without breaking development features, the app configures strict headers:
- **Development:** Allows `'unsafe-eval'` for Next.js Fast Refresh and Sandpack runtime environment.
- **Production:** Hardened CSP blocks runtime script evaluation and limits resource domains to trusted CDNs (like Tailwind CDN, custom analytics, etc.).

---

## License

This project is open-source. Feel free to customize it to fit your design system and generation pipelines.
