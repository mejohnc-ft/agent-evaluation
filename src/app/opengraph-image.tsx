import { cacheLife } from "next/cache";
import { ImageResponse } from "next/og";

// Share card: the empty state's eyebrow and headline, then the header's footnote under a hairline.
export const alt = "Cadre AI Assistant: ask about Cadre's services, industries and how to work with the team.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const EYEBROW = "CADRE AI ASSISTANT";
const HEADLINE = "Ask about Cadre's services, industries and how to work with the team.";
const FOOTNOTE = "AI assistant · answers from cadre.ai";

// Inter subset to the glyphs used, fetched at build like next/font and
// cached with "use cache" (Cache Components hangs uncached fetches while prerendering). A failed
// fetch fails the build.
async function inter(weight: number, text: string): Promise<ArrayBuffer> {
  "use cache";
  cacheLife("max");
  const cssUrl = `https://fonts.googleapis.com/css2?family=Inter:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(cssUrl)).text();
  const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
  if (!url) throw new Error(`Inter ${weight}: no truetype source in the Google Fonts CSS`);
  return (await fetch(url)).arrayBuffer();
}

export default async function OpengraphImage() {
  const [regular, medium, semibold] = await Promise.all([
    inter(400, FOOTNOTE),
    inter(500, EYEBROW),
    inter(600, HEADLINE),
  ]);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          padding: "96px 104px",
          fontFamily: "Inter",
          color: "#0c0407",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontSize: 24,
              fontWeight: 500,
              letterSpacing: "0.06em",
              color: "#666666",
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: 6, background: "#db4545" }} />
            {EYEBROW}
          </div>
          <div
            style={{
              marginTop: 36,
              maxWidth: 940,
              fontSize: 68,
              fontWeight: 600,
              lineHeight: 1.15,
              letterSpacing: "-0.022em",
            }}
          >
            {HEADLINE}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ height: 1, background: "#0000001a" }} />
          <div style={{ marginTop: 28, fontSize: 26, fontWeight: 400, color: "#666666" }}>{FOOTNOTE}</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: regular, weight: 400, style: "normal" },
        { name: "Inter", data: medium, weight: 500, style: "normal" },
        { name: "Inter", data: semibold, weight: 600, style: "normal" },
      ],
    },
  );
}
