import { cacheLife } from "next/cache";
import { ImageResponse } from "next/og";

// Browser-tab icon: a typeset "C" monogram (not Cadre's logo) on the AA-safe red fill.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Inter Bold subset to one glyph, fetched at build like next/font and
// cached with "use cache" (Cache Components hangs uncached fetches while prerendering). A failed
// fetch fails the build.
async function interBold(text: string): Promise<ArrayBuffer> {
  "use cache";
  cacheLife("max");
  const cssUrl = `https://fonts.googleapis.com/css2?family=Inter:wght@700&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(cssUrl)).text();
  const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
  if (!url) throw new Error("Inter Bold: no truetype source in the Google Fonts CSS");
  return (await fetch(url)).arrayBuffer();
}

export default async function Icon() {
  const font = await interBold("C");
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#c43a3a",
          borderRadius: 7,
          color: "#ffffff",
          fontFamily: "Inter",
          fontSize: 24,
          fontWeight: 700,
        }}
      >
        C
      </div>
    ),
    { ...size, fonts: [{ name: "Inter", data: font, weight: 700, style: "normal" }] },
  );
}
