import { ImageResponse } from "next/og";
import { inter } from "./og-font";

// Home-screen icon: the icon.tsx monogram, full-bleed square (iOS applies its own mask).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";


export default async function AppleIcon() {
  const font = await inter(700, "C");
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
          color: "#ffffff",
          fontFamily: "Inter",
          fontSize: 116,
          fontWeight: 700,
        }}
      >
        C
      </div>
    ),
    { ...size, fonts: [{ name: "Inter", data: font, weight: 700, style: "normal" }] },
  );
}
