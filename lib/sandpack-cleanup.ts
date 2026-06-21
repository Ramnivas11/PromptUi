export function cleanupSandpackIframes(): void {
  // Find and clean up old Sandpack iframes
  const iframes = document.querySelectorAll('iframe');
  
  iframes.forEach((iframe) => {
    const src = iframe.getAttribute('src');
    // Only clean up Sandpack/CodeSandbox iframes
    if (src && (src.includes('sandpack') || src.includes('codesandbox'))) {
      try {
        // Hide and remove
        iframe.style.display = 'none';
        iframe.style.visibility = 'hidden';
        
        // Clear contentWindow references
        if (iframe.contentWindow) {
          try {
            iframe.contentWindow.location.href = 'about:blank';
          } catch {
            // Cross-origin, can't access
          }
        }
        
        // Schedule for removal
        setTimeout(() => {
          iframe.remove();
        }, 100);
      } catch (error) {
        console.error("Failed to cleanup iframe:", error);
      }
    }
  });
}

export function getIframeCount(): number {
  return document.querySelectorAll(
    'iframe[src*="sandpack"], iframe[src*="codesandbox"]'
  ).length;
}
