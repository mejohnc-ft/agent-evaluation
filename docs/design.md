# Design system

Reference for the chat UI. Source of truth is `src/app/globals.css` (tokens, type, utilities) and
`src/app/components/`. If this page and the code disagree, the code wins; fix this page.

## Tokens

Colours are CSS variables on `:root`, swapped under `prefers-color-scheme: dark`, and exposed to
Tailwind via `@theme inline` (`bg-surface`, `text-ink`, `border-hairline`, ...). Light values come
from cadre.ai's production CSS; dark values are our own.

| Token | Light | Dark | cadre.ai source / note |
| --- | --- | --- | --- |
| `surface` | `#ffffff` | `#0f0c0d` | page background |
| `sunken` | `#f9f9f9` | `#171314` | `--colors--black-50` |
| `bubble` | `#f2efe4` | `#241e1f` | `--cadre-sand-dark` (user bubble) |
| `ink` | `#0c0407` | `#f4f2f1` | `--colors--black-900` |
| `ink-2` | `#333333` | `#dedad9` | `--colors--black-800` (prose) |
| `muted` | `#666666` | `#a8a3a2` | `--colors--black-600`, 5.7:1 |
| `faint` | `#737373` | `#8f8a89` | placeholders, icons, 4.7:1 |
| `hairline` | `#0000001a` | `#ffffff1a` | `--wf-hairline` |
| `hairline-strong` | `#00000033` | `#ffffff33` | inputs, composer |
| `accent` | `#db4545` | `#ec6a6a` | `--cadre-red`: dots, alert icon |
| `accent-ink` | `#c43a3a` | `#f07a7a` | red text on surface (errors), 5.2:1 |
| `accent-fill` / `-hover` | `#c43a3a` / `#a93131` | `#c43a3a` / `#d24a4a` | filled buttons |
| `accent-soft` | `#fbe9e9` | `#2c1617` | `--red-soft`: selection, error ring |
| `ink-fill` / `-hover` | `#0c0407` / `#333333` | `#f4f2f1` / `#ffffff` | send button, handoff check |
| `on-ink` | `#ffffff` | `#0c0407` | content on `ink-fill` |

| Other | Value | Source |
| --- | --- | --- |
| `rounded-input` | 0.5rem (8 px) | `--v-radius-input` |
| `rounded-card` | 1rem (16 px) | `--v-radius-card` |
| `rounded-panel` | 1.5rem (24 px) | `--v-radius-panel` |
| `rounded-button` | 2.25rem (pill) | `--v-radius-button` |
| `shadow-card` | `0 28px 32px #00000008, 0 1px 2px #0000000a` (dark: inset top highlight + deeper drop) | `--v-shadow-card` plus a lift |
| `ease-out-expo` | `cubic-bezier(0.19, 1, 0.22, 1)` | `--wf-ease-out-expo` |

Font: Inter via `next/font/google` (`--font-inter`), falling back to `system-ui`.

## Type

Seven steps, each with its own leading and tracking (tight for large, open for small). Use the
`text-<name>` utility; don't set font sizes ad hoc.

| Style | Size / leading | Apple HIG | Used for |
| --- | --- | --- | --- |
| `display` | 34 / 40 | Large Title | empty-state heading |
| `title` | 20 / 28 | Title 3 | defined, not used yet |
| `headline` | 17 / 24 | Headline | card titles, header wordmark |
| `body` | 16 / 26 | Body | assistant prose (`.chat-prose`), user bubble, composer, inputs on phones |
| `callout` | 15 / 22 | Callout | card text, buttons, starters, inputs from `sm` up |
| `footnote` | 13 / 18 | Footnote | form labels, errors, header label, retry button |
| `caption` | 12 / 16 | Caption | eyebrows, disclaimer, hints, counter, handoff reference |

Inputs use `body` (16 px) on phones so iOS Safari doesn't zoom on focus.

## Spacing and layout

4 px rhythm (Tailwind's default scale). Key measures:

| Measure | Value | Where |
| --- | --- | --- |
| Control height | 44 px (`min-h-11` / `size-11`) | buttons, inputs, send, checkbox row |
| Card padding | 20 px, 24 px from `sm` | `Card` (`p-5 sm:p-6`) |
| Between turns | 32 px | `MessageList` (`gap-8`) |
| Reply to card | 20 px | `AssistantMessage` (`gap-5`) |
| Eyebrow to content | 12 px | `Card` (`mb-3`) |
| Column | 42rem max | header, conversation, composer |
| Side gutter | 20 px or the safe-area inset, whichever is larger | `.gutter` |

## Interaction

- **Hit targets.** 44 px minimum (HIG). Inline text links keep their size and get `.hit-44`, a
  44 px-tall invisible `::after`. The consent checkbox's whole label row is the target.
- **Focus.** Text fields and the composer draw their own neutral focus: border to `ink/60` plus a
  3 px `ink/8` ring. Links, buttons and checkboxes use the global `:focus-visible` outline
  (2 px `ink`, 2 px offset) from `globals.css`. Focus is never red: red means error or conversion,
  and a red ring disappears around a red button.
- **Red is for errors and conversion.** Field errors use `accent-ink` text, an `accent-ink` border
  and an `accent-soft` ring. Filled red buttons (`primaryButton` in `card.tsx`) are only for the
  conversion action in a card. The send button is ink, not red.
- **Brand red vs fill red.** `#db4545` with white text is 4.24:1 and fails WCAG AA, so filled
  buttons use `#c43a3a` (5.23:1). `#db4545` stays for dots and accents.
- **Errors never show raw messages.** `ChatError` is fixed copy with a retry button.

## Cards

Tool results render as cards below the reply text. `ToolCard` validates each output with zod
(`tool-outputs.ts`) before rendering; anything unexpected (wrong state, unknown tool, failed
parse) renders nothing.

Anatomy (`Card` in `card.tsx`): `section` with hairline border, `rounded-card`, `shadow-card`,
20/24 px padding, `animate-rise`.

1. Eyebrow: `.eyebrow`, caption size, uppercase, 0.06em tracking, `muted`. Also the section's
   `aria-label`.
2. Title (optional): `headline`, semibold, `ink`.
3. Body: `callout`, `muted` or `ink-2`.
4. Action: one `primaryButton`, full width on phones, auto from `sm` up.

| Card | Tool | Appears when |
| --- | --- | --- |
| `NextStepCard` | `get_booking_link` | a strategy call or AI Maturity Index link is offered; URL must match the allowlisted prefixes |
| `ContactFormCard` | `show_contact_form` | the visitor needs a human; collapses to "Details sent" once submitted |
| `HandoffCard` | `request_human_followup` | confirms only when `ok === true` (row written); otherwise an `alert` tone card with the fallback email |
| (none) | `log_knowledge_gap` | never rendered |

## Dark mode, motion, safe areas

- **Dark mode** follows the OS (`prefers-color-scheme`); there is no toggle. Every colour goes
  through a token, so components need no `dark:` variants. `themeColor` in `layout.tsx` matches
  `surface` in each scheme.
- **Motion.** New messages, cards and the empty state use `animate-rise`: 0.4 s, `ease-out-expo`,
  opacity 0 to 1 and 6 px up. Hovers use 300 ms `ease-out-expo` transitions. The typing indicator
  pulses at 1.2 s. Under `prefers-reduced-motion: reduce`, all animations and transitions drop to
  0.01 ms.
- **Safe areas.** `viewportFit: "cover"` in the viewport export makes `env(safe-area-inset-*)`
  report real values. The header pads by the top inset, the composer footer by the bottom inset
  (at least 12 px), and `.gutter` clears the side insets in landscape.

## Adding a component

- One job per file in `src/app/components/`; propose a split near 150 lines.
- Colours from tokens only (`bg-surface`, `text-muted`, ...); no hex values and no `dark:`.
- Text from the seven styles only.
- Interactive elements at least 44 px, or `.hit-44` for inline links.
- Neutral focus for fields; leave the global outline on links and buttons. Red only for errors
  and the one conversion action.
- Anything rendered from a tool or the network is parsed first (see `tool-outputs.ts`) and
  renders nothing on mismatch.
- Entrances use `animate-rise`; transitions use `ease-out-expo`. Check reduced motion.
- Decorative icons come from `icons.tsx` (`aria-hidden`); interactive icons need a label.
- Check light and dark, a 375 px viewport, and keyboard focus before calling it done.
