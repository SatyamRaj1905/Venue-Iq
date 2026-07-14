import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#06111d",
        color: "#f4f8fb",
        position: "relative",
      }}
    >
      <div
        style={{
          width: 352,
          height: 250,
          border: "22px solid #49e7ff",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 70px rgba(73,231,255,.32)",
        }}
      >
        <div
          style={{
            width: 238,
            height: 146,
            border: "10px solid #18364a",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 86,
            fontWeight: 800,
            letterSpacing: -8,
          }}
        >
          V<span style={{ color: "#49e7ff" }}>IQ</span>
        </div>
      </div>
    </div>,
    size,
  );
}
