import { IconButton } from "./icon-button";
import { Compose, PanelRight } from "./icons";
import { ThemeToggle } from "./theme-toggle";

export const PANEL_ID = "behind-the-scenes";
export const PANEL_TOGGLE_ID = "panel-toggle";

type Props = { onNewChat: () => void; newChatDisabled: boolean; panelOpen: boolean; onTogglePanel: () => void };

// Text wordmark (no Cadre logo files), then the chat controls at the far right. Full width, so the
// controls don't move when the side panel opens. The 44px buttons' own padding stands in for the
// right gutter. Clears the notch on iOS.
export function SiteHeader({ onNewChat, newChatDisabled, panelOpen, onTogglePanel }: Props) {
  return (
    <header className="sticky top-0 z-20 border-b border-hairline bg-surface/85 pt-[env(safe-area-inset-top)] backdrop-blur-md supports-[backdrop-filter]:bg-surface/75">
      <div className="flex h-14 items-center justify-between gap-3 pr-[max(0.5rem,env(safe-area-inset-right))] pl-[max(1.25rem,env(safe-area-inset-left))]">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="text-headline font-semibold tracking-[-0.03em] whitespace-nowrap text-ink">Cadre AI</span>
          <span aria-hidden="true" className="h-4 w-px bg-hairline-strong" />
          <span className="text-footnote font-medium text-muted">Assistant</span>
        </div>
        <nav aria-label="Chat controls" className="flex items-center">
          <IconButton label="New chat" onClick={onNewChat} disabled={newChatDisabled}>
            <Compose className="size-[1.125rem]" />
          </IconButton>
          <ThemeToggle />
          <IconButton
            id={PANEL_TOGGLE_ID}
            label="Behind the scenes"
            aria-expanded={panelOpen}
            aria-controls={PANEL_ID}
            active={panelOpen}
            onClick={onTogglePanel}
          >
            <PanelRight className="size-[1.125rem]" />
          </IconButton>
        </nav>
      </div>
    </header>
  );
}
