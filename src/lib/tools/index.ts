import type { ToolContext } from "../store/types";
import { getBookingLink } from "./booking-link";
import { requestHumanFollowup } from "./human-followup";
import { logKnowledgeGap } from "./knowledge-gap";

export function createTools(ctx: ToolContext) {
  return {
    get_booking_link: getBookingLink,
    request_human_followup: requestHumanFollowup(ctx),
    log_knowledge_gap: logKnowledgeGap(ctx),
  };
}
