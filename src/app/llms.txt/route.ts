import { llmsTxt } from "@/lib/ai";

/** /llms.txt: a short guide to the site for AI assistants (see llmstxt.org). */
export function GET() {
  return new Response(llmsTxt(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
