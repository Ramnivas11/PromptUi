export function sanitizeUserPrompt(input: string): string {
  // Remove known prompt injection patterns
  const injectionPatterns = [
    /ignore\s+all\s+previous\s+instructions/gi,
    /disregard\s+(?:the\s+)?system\s+(?:prompt|message)/gi,
    /forget\s+(?:previous\s+)?instructions/gi,
    /new\s+instructions?:/gi,
    /jailbreak/gi,
    /break\s+character/gi,
    /role\s+play\s+as/gi,
    /pretend\s+(?:you're|you\s+are)/gi,
    /you\s+are\s+no\s+longer/gi,
  ];

  let sanitized = input;
  
  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, "");
  }

  // Remove suspicious keywords
  const suspiciousPatterns = [
    /from\s+['"](http|ftp|file)/gi,  // Prevent external imports
    /eval\s*\(/gi,
    /new\s+Function/gi,
    /require\s*\(/gi,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitized)) {
      console.warn("Potentially dangerous prompt detected");
      sanitized = sanitized.replace(pattern, "[REMOVED]");
    }
  }

  return sanitized;
}

export function validateGeneratedCode(code: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for dangerous functions/patterns
  const dangerousPatterns = [
    { pattern: /eval\s*\(/gi, name: "eval()" },
    { pattern: /new\s+Function/gi, name: "new Function()" },
    { pattern: /require\s*\(\s*['"]/gi, name: "require()" },
    { pattern: /import\s+.*from\s+['"](http|ftp|\.\.)/gi, name: "external imports" },
    { pattern: /fetch\s*\(\s*['"](http|ftp)/gi, name: "external fetch" },
    { pattern: /localStorage\s*\./gi, name: "localStorage access" },
    { pattern: /sessionStorage\s*\./gi, name: "sessionStorage access" },
    { pattern: /document\.cookie/gi, name: "cookie access" },
    { pattern: /document\.domain/gi, name: "domain manipulation" },
    { pattern: /window\.location/gi, name: "navigation" },
  ];

  for (const { pattern, name } of dangerousPatterns) {
    if (pattern.test(code)) {
      errors.push(`Potentially unsafe pattern detected: ${name}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
