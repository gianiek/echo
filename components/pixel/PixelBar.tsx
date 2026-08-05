type SegmentedBarProps = {
  variant: "segments";
  segments?: number;
  filled: number;
  color?: string;
};

type RatioBarProps = {
  variant: "percent";
  percent: number;
  color?: string;
};

type PixelBarProps = SegmentedBarProps | RatioBarProps;

export default function PixelBar(props: PixelBarProps) {
  if (props.variant === "percent") {
    const clamped = Math.max(0, Math.min(100, props.percent));
    return (
      <div className="ratio-bar">
        <i
          style={{
            width: `${clamped}%`,
            // @ts-expect-error -- custom property
            "--pixel-bar-color": props.color ?? "var(--accent)",
          }}
        />
      </div>
    );
  }

  const segments = props.segments ?? 8;
  const filled = Math.max(0, Math.min(segments, props.filled));

  return (
    <div
      className="pixel-bar"
      style={{
        // @ts-expect-error -- custom property
        "--pixel-bar-segments": segments,
        "--pixel-bar-color": props.color ?? "var(--accent)",
      }}
    >
      {Array.from({ length: segments }, (_, i) => (
        <span key={i} className={i < filled ? "on" : ""} />
      ))}
    </div>
  );
}
