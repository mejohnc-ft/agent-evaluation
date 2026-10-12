// Deletion request: npm run delete-contact -- --email person@example.com
//                or  npm run delete-contact -- --conversation <id>
// Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Prints counts only, never the deleted data.
import { parseArgs } from "node:util";
import { deleteContact } from "../src/lib/store/maintenance";

const { values } = parseArgs({ options: { email: { type: "string" }, conversation: { type: "string" } } });
if (!values.email === !values.conversation) {
  console.error("Pass exactly one of --email or --conversation");
  process.exit(1);
}

deleteContact(values.email ? { email: values.email } : { conversationId: values.conversation! })
  .then((deleted) => console.log("deleted", deleted))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
