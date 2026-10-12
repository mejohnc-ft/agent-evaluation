import { cacheLife } from "next/cache";

// Inter subset to the glyphs used, for ImageResponse (icons and the share card). Fetched at build
// like next/font and cached with "use cache" (Cache Components hangs uncached fetches while
// prerendering). A failed fetch fails the build.
export async function inter(weight: number, text: string): Promise<ArrayBuffer> {
  "use cache";
  cacheLife("max");
  const cssUrl = `https://fonts.googleapis.com/css2?family=Inter:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(cssUrl)).text();
  const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
  if (!url) throw new Error(`Inter ${weight}: no truetype source in the Google Fonts CSS`);
  return (await fetch(url)).arrayBuffer();
}
