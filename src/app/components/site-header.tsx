// Text wordmark (no Cadre logo files) plus a quiet "Assistant" label.
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-hairline bg-surface/85 backdrop-blur-md supports-[backdrop-filter]:bg-surface/75">
      <div className="mx-auto flex h-14 max-w-[42rem] items-center justify-between gap-4 px-5">
        <div className="flex items-center gap-2.5">
          <span className="text-[1.0625rem] font-semibold tracking-[-0.03em] text-ink">
            Cadre AI
          </span>
          <span aria-hidden="true" className="h-4 w-px bg-hairline-strong" />
          <span className="text-[0.8125rem] font-medium tracking-[-0.01em] text-muted">Assistant</span>
        </div>
        <p className="text-right text-xs text-muted">
          AI assistant<span className="hidden min-[400px]:inline"> · answers from cadre.ai</span>
        </p>
      </div>
    </header>
  );
}
