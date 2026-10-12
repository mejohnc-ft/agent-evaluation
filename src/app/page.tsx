import { Suspense } from "react";
import { Chat } from "./chat";

// useChat generates ids at render; cacheComponents requires it inside Suspense.
export default function Page() {
  return (
    <Suspense>
      <Chat />
    </Suspense>
  );
}
