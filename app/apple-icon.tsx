import { ImageResponse } from "next/og";
import { BAT_PIXELS, BAT_EYES, BAT_COLS, BAT_ROWS } from "@/lib/batPixels";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const INK = "#2b1233";
const PANEL = "#fff6fb";
const BG = "#ff4fa3";
const CELL = 10;

export default function AppleIcon() {
  const eyeSet = new Set(BAT_EYES.map(([x, y]) => `${x},${y}`));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BG,
        }}
      >
        <div
          style={{
            position: "relative",
            width: BAT_COLS * CELL,
            height: BAT_ROWS * CELL,
            display: "flex",
          }}
        >
          {BAT_PIXELS.map(([x, y]) => (
            <div
              key={`${x},${y}`}
              style={{
                position: "absolute",
                left: x * CELL,
                top: y * CELL,
                width: CELL,
                height: CELL,
                background: eyeSet.has(`${x},${y}`) ? PANEL : INK,
              }}
            />
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
