/**
 * Wraps simple plain text into a valid RichText AST structure.
 * Used for system messages or public API calls where the client
 * only provides raw text.
 */
export function wrapTextInAST(text: string) {
  return {
    root: {
      children: [
        {
          type: "paragraph" as const,
          children: [{ type: "text" as const, text }],
        },
      ],
    },
  };
}
