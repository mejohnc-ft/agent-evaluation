import ReactMarkdown, { type Components } from "react-markdown";

// Links render as plain text (the server strips URLs; the only clickable links come from tool
// cards). Images and raw HTML are dropped; headings flatten to bold paragraphs.
const heading: Components["h1"] = ({ children }) => <p className="font-semibold text-ink">{children}</p>;

const components: Components = {
  a: ({ children }) => <span>{children}</span>,
  img: () => null,
  h1: heading,
  h2: heading,
  h3: heading,
  h4: heading,
  h5: heading,
  h6: heading,
};

export function Markdown({ text }: { text: string }) {
  return (
    <div className="chat-prose">
      <ReactMarkdown components={components} skipHtml>
        {text}
      </ReactMarkdown>
    </div>
  );
}
