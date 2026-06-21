export function validateReactCode(code: string): {
  safe: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check for dangerouslySetInnerHTML
  if (/dangerouslySetInnerHTML/gi.test(code)) {
    warnings.push(
      "Code uses dangerouslySetInnerHTML. Ensure all content is sanitized."
    );
  }

  // Check for innerHTML assignment
  if (/\.innerHTML\s*=/gi.test(code)) {
    warnings.push("Code directly assigns innerHTML. This is a security risk.");
  }

  // Check for unescaped user input
  if (/\${.*user/gi.test(code) || /\${.*input/gi.test(code)) {
    warnings.push("Code may contain unescaped user input.");
  }

  // Check for external script tags
  if (/<script\s+src=/gi.test(code)) {
    warnings.push("Code contains external script tags. Use React components instead.");
  }

  return {
    safe: warnings.length === 0,
    warnings,
  };
}
