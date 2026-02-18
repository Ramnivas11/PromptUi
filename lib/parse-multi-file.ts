/**
 * Parses multi-file AI output into a Record<filename, code>.
 *
 * Expected format:
 *   ---FILE: /App.js---
 *   ...code...
 *   ---FILE: /Header.js---
 *   ...code...
 *
 * Falls back to { "/App.js": rawCode } if no delimiters found.
 */
export function parseMultiFileOutput(raw: string): Record<string, string> {
    const delimiter = /^---FILE:\s*(.+?)---\s*$/gm;
    const matches: { file: string; index: number; length: number }[] = [];
    let match: RegExpExecArray | null;
    while ((match = delimiter.exec(raw)) !== null) {
        matches.push({ file: match[1].trim(), index: match.index, length: match[0].length });
    }

    // No delimiters → single file fallback
    if (matches.length === 0) {
        return { "/App.js": raw.trim() };
    }

    const files: Record<string, string> = {};

    for (let i = 0; i < matches.length; i++) {
        const filePath = matches[i].file;
        const startIdx = matches[i].index + matches[i].length;
        const endIdx = i < matches.length - 1 ? matches[i + 1].index : raw.length;
        let content = raw.slice(startIdx, endIdx).trim();

        // Strip any markdown fences wrapping individual file contents
        content = content
            .replace(/^```(?:jsx|javascript|tsx|js|react)?\s*\n?/i, "")
            .replace(/\n?```\s*$/i, "")
            .trim();

        if (filePath && content) {
            files[filePath] = content;
        }
    }

    // Safety: ensure /App.js always exists
    if (!files["/App.js"] && Object.keys(files).length > 0) {
        const firstKey = Object.keys(files)[0];
        files["/App.js"] = files[firstKey];
    }

    if (Object.keys(files).length === 0) {
        return { "/App.js": raw.trim() };
    }

    // ========== POST-PROCESSING PIPELINE ==========

    // Pass 1: Ensure every non-App file has a default export
    for (const filePath of Object.keys(files)) {
        if (filePath !== "/App.js") {
            files[filePath] = fixDefaultExport(files[filePath], filePath);
        }
    }

    // Pass 2: Fix named imports → default imports in EVERY file (not just App.js)
    for (const filePath of Object.keys(files)) {
        files[filePath] = fixNamedImports(files[filePath], files);
    }

    // Pass 3: Remove imports to files that don't exist in our file set
    for (const filePath of Object.keys(files)) {
        files[filePath] = removeDeadImports(files[filePath], files);
    }

    return files;
}

/**
 * Ensures a component file has a default export.
 */
function fixDefaultExport(code: string, filePath: string): string {
    // Already has a default export → no fix needed
    if (/export\s+default\s+/.test(code)) return code;

    // Derive expected component name from filename: /Header.js → Header
    const baseName = filePath.replace(/^\//, "").replace(/\.jsx?$/, "");
    const componentName = baseName.charAt(0).toUpperCase() + baseName.slice(1);

    // Pattern: `export function ComponentName(`  →  `export default function ComponentName(`
    const namedFnRegex = new RegExp(`export\\s+function\\s+${componentName}\\s*\\(`);
    if (namedFnRegex.test(code)) {
        return code.replace(namedFnRegex, `export default function ${componentName}(`);
    }

    // Pattern: `export const ComponentName =`  →  remove export, add default at end
    const namedConstRegex = new RegExp(`export\\s+const\\s+${componentName}\\s*=`);
    if (namedConstRegex.test(code)) {
        code = code.replace(namedConstRegex, `const ${componentName} =`);
        code += `\nexport default ${componentName};`;
        return code;
    }

    // Pattern: any `export function X(`  →  `export default function X(`
    if (/export\s+function\s+\w+\s*\(/.test(code)) {
        return code.replace(/export\s+function\s+(\w+)\s*\(/, "export default function $1(");
    }

    // No export at all — find a function/const declaration and add default export
    const arrowMatch = code.match(/(?:const|let|var)\s+(\w+)\s*=\s*(?:\(|function)/);
    if (arrowMatch && !code.includes("export default")) {
        code += `\nexport default ${arrowMatch[1]};`;
        return code;
    }

    const funcMatch = code.match(/function\s+(\w+)\s*\(/);
    if (funcMatch && !code.includes("export default")) {
        code += `\nexport default ${funcMatch[1]};`;
        return code;
    }

    return code;
}

/**
 * Converts named imports { X } to default imports X
 * for all local file imports (./Something) that exist in our file set.
 */
function fixNamedImports(code: string, allFiles: Record<string, string>): string {
    // Match: import { Name } from './ModuleName'
    // Also: import { Name, Other } from './ModuleName' (takes first)
    const namedImportRegex = /import\s*\{\s*(\w+)(?:\s*,\s*\w+)*\s*\}\s*from\s*['"]\.\/([\w-]+)['"]/g;

    return code.replace(namedImportRegex, (fullMatch, importName, moduleName) => {
        const possiblePaths = [`/${moduleName}.js`, `/${moduleName}.jsx`];
        const exists = possiblePaths.some((p) => p in allFiles);

        if (exists) {
            return `import ${importName} from './${moduleName}'`;
        }
        return fullMatch; // Not a local file we know about — leave it (could be lucide-react etc.)
    });
}

/**
 * Removes import statements for local modules that don't exist in our file set.
 * This prevents "module not found" errors when the AI references files it didn't create.
 */
function removeDeadImports(code: string, allFiles: Record<string, string>): string {
    // Match: import Something from './ModuleName'  or  import { X } from './ModuleName'
    const localImportRegex = /^import\s+(?:\w+|\{[^}]+\})\s+from\s+['"]\.\/([\w-]+)['"];?\s*$/gm;

    return code.replace(localImportRegex, (fullMatch, moduleName) => {
        const possiblePaths = [`/${moduleName}.js`, `/${moduleName}.jsx`];
        const exists = possiblePaths.some((p) => p in allFiles);

        if (exists) {
            return fullMatch; // File exists, keep the import
        }

        // File doesn't exist — comment out the import to prevent crash
        return `// [auto-removed] ${fullMatch.trim()}`;
    });
}

/**
 * Strips markdown code fences from AI output.
 */
export function stripMarkdownFences(code: string): string {
    return code
        .replace(/^```(?:jsx|javascript|tsx|js|react)?\s*\n?/i, "")
        .replace(/\n?```\s*$/i, "")
        .trim();
}
