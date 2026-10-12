import { knowledgeSources } from "./knowledge-sources";

// The knowledge sources the assistant answers from, for the "Behind the scenes" panel. With Cache
// Components a GET handler is prerendered when its data is cached ("use cache" in the helper).
export async function GET() {
  return Response.json(await knowledgeSources());
}
