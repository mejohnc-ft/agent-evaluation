// The model is asked to call log_knowledge_gap whenever it can't answer, but tool calls aren't
// guaranteed. When the reply says it lacks the information and no gap was logged, generateReply logs
// one itself, so every unanswered question reaches knowledge_gaps.
const NO_INFORMATION =
  /\b(?:I )?(?:don't|do not) have (?:any )?(?:information|details|specifics)\b|\bnot (?:something )?covered\b|\bisn't covered\b|\bI can't find\b/i;

export function needsGapFallback(replyText: string, toolNames: string[]): boolean {
  if (toolNames.includes("log_knowledge_gap")) return false;
  return NO_INFORMATION.test(replyText.replace(/[‘’]/g, "'"));
}
