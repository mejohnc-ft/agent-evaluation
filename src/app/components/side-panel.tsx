"use client";

import type { UIMessage } from "ai";
import { useState } from "react";
import { ActivityFeed } from "./activity-feed";
import { IconButton } from "./icon-button";
import { Close } from "./icons";
import { PANEL_ID, PANEL_TOGGLE_ID } from "./site-header";
import { SourcesList } from "./sources-list";
import { Tabs, type TabDef } from "./tabs";

type Tab = "activity" | "sources";
const TABS: TabDef<Tab>[] = [
  { id: "activity", label: "Activity" },
  { id: "sources", label: "Sources" },
];

// Before the panel hides, hand focus that was inside it back to the toggle, so it isn't lost.
export function releasePanelFocus() {
  if (document.getElementById(PANEL_ID)?.contains(document.activeElement)) {
    document.getElementById(PANEL_TOGGLE_ID)?.focus();
  }
}

// "Behind the scenes": a non-modal panel. Opening it never moves focus and nothing is trapped;
// Esc closes it while focus is inside. A right column from 1024px, a bottom sheet above the
// composer below that. Stays mounted while hidden, so the Sources list is fetched only once.
export function SidePanel({ open, onClose, messages }: { open: boolean; onClose: () => void; messages: UIMessage[] }) {
  const [tab, setTab] = useState<Tab>("activity");
  const [sourcesSeen, setSourcesSeen] = useState(false);

  function close() {
    releasePanelFocus();
    onClose();
  }

  return (
    <aside
      id={PANEL_ID}
      aria-label="Behind the scenes"
      hidden={!open}
      onKeyDown={(e) => {
        if (e.key === "Escape") close();
      }}
      className="flex max-h-[60dvh] animate-rise flex-col rounded-t-panel border-t border-hairline bg-surface shadow-sheet lg:fixed lg:top-[calc(3.5rem+1px+env(safe-area-inset-top))] lg:right-0 lg:bottom-0 lg:max-h-none lg:w-[22rem] lg:animate-none lg:rounded-none lg:border-t-0 lg:border-l lg:shadow-none"
    >
      <div className="gutter shrink-0 pt-2 lg:pr-2 lg:pl-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-headline font-semibold text-ink">Behind the scenes</h2>
          <IconButton label="Close panel" onClick={close}>
            <Close className="size-4" />
          </IconButton>
        </div>
        <Tabs tabs={TABS} selected={tab} onSelect={(next) => {
            setTab(next);
            if (next === "sources") setSourcesSeen(true);
          }} idPrefix="bts" label="Behind the scenes" />
      </div>
      <div className="gutter min-h-0 flex-1 overflow-y-auto overscroll-contain lg:px-5">
        <div role="tabpanel" id="bts-panel-activity" aria-labelledby="bts-tab-activity" hidden={tab !== "activity"} tabIndex={0}>
          <ActivityFeed messages={messages} />
          <p className="border-t border-hairline py-4 text-caption text-muted">
            Handoffs are saved to the database; no email notification is configured in this demo.
          </p>
        </div>
        <div role="tabpanel" id="bts-panel-sources" aria-labelledby="bts-tab-sources" hidden={tab !== "sources"} tabIndex={0}>
          {sourcesSeen && <SourcesList />}
        </div>
      </div>
    </aside>
  );
}
