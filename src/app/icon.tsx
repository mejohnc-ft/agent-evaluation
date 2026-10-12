import { ImageResponse } from "next/og";
import { inter } from "./og-font";

// Browser-tab icon: a typeset "C" monogram (not Cadre's logo) on the AA-safe red fill.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";


export default async function Icon() {
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
