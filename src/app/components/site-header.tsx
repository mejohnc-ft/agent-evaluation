// Text wordmark (no Cadre logo files) plus a quiet "Assistant" label. Clears the notch on iOS.
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-hairline bg-surface/85 pt-[env(safe-area-inset-top)] backdrop-blur-md supports-[backdrop-filter]:bg-surface/75">
      <div className="gutter mx-auto flex h-14 max-w-[42rem] box-content items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="text-headline font-semibold tracking-[-0.03em] text-ink">Cadre AI</span>
          <span aria-hidden="true" className="h-4 w-px bg-hairline-strong" />
          <span className="text-footnote font-medium text-muted">Assistant</span>
        </div>
        <p className="text-right text-caption text-muted">
          AI assistant<span className="hidden min-[400px]:inline"> · answers from cadre.ai</span>
        </p>
      </div>
    </header>
  );
}
