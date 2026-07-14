import { ImageResponse } from "next/og";

export const alt =
  "VenueIQ — one intelligent layer for safer, smoother and more inclusive tournament days";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function StadiumRings() {
  return (
    <>
      <div
        style={{
          position: "absolute",
          width: 660,
          height: 470,
          right: -90,
          top: 76,
          border: "3px solid rgba(73,231,255,.45)",
          borderRadius: "50%",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 330,
          right: -10,
          top: 145,
          border: "2px solid rgba(167,244,91,.22)",
          borderRadius: "50%",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 320,
          height: 194,
          right: 80,
          top: 214,
          border: "2px solid rgba(73,231,255,.16)",
          borderRadius: "50%",
          display: "flex",
        }}
      />
    </>
  );
}

function VenueBrand() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 34, fontWeight: 800 }}>
      Venue<span style={{ color: "#49e7ff", marginLeft: -16 }}>IQ</span>
      <span
        style={{ width: 8, height: 8, borderRadius: 99, background: "#a7f45b", marginLeft: 10 }}
      />
    </div>
  );
}

function OpenGraphCopy() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 25 }}>
      <div style={{ color: "#49e7ff", fontSize: 20, textTransform: "uppercase", letterSpacing: 4 }}>
        Tournament-day intelligence
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: 67,
          lineHeight: 1.02,
          fontWeight: 780,
          letterSpacing: -3,
        }}
      >
        <span>Safer. Smoother.</span>
        <span>More inclusive.</span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          color: "#aabcca",
          fontSize: 25,
          lineHeight: 1.45,
        }}
      >
        <span>Grounded AI support for fans, volunteers</span>
        <span>and venue operations.</span>
      </div>
    </div>
  );
}

function OpenGraphFooter() {
  return (
    <div style={{ display: "flex", gap: 12, color: "#aabcca", fontSize: 16 }}>
      <span>Grounded data</span>
      <span>·</span>
      <span>Human-led decisions</span>
      <span>·</span>
      <span>Simulated demo</span>
    </div>
  );
}

function OpenGraphCanvas() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        padding: 64,
        background: "#06111d",
        color: "#f4f8fb",
        position: "relative",
        overflow: "hidden",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <StadiumRings />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: 760,
        }}
      >
        <VenueBrand />
        <OpenGraphCopy />
        <OpenGraphFooter />
      </div>
    </div>
  );
}

export default function OpenGraphImage() {
  return new ImageResponse(<OpenGraphCanvas />, size);
}
