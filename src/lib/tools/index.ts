import type { ToolContext } from "../store/types";
import { answerDirectly } from "./answer-directly";
import { getBookingLink } from "./booking-link";
import { showContactForm } from "./contact-form";
import { requestHumanFollowup } from "./human-followup";
import { getPageLink } from "./page-link";
import { logKnowledgeGap } from "./knowledge-gap";

export function createTools(ctx: ToolContext) {
  return {
    answer_directly: answerDirectly,
    get_booking_link: getBookingLink,
    get_page_link: getPageLink,
    show_contact_form: showContactForm,
    request_human_followup: requestHumanFollowup(ctx),
    log_knowledge_gap: logKnowledgeGap(ctx),
  };
}
