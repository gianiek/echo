import type { ButtonHTMLAttributes } from "react";

type PixelButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "accent";
  fab?: boolean;
};

export default function PixelButton({
  variant = "default",
  fab = false,
  className = "",
  ...props
}: PixelButtonProps) {
  const classes = [
    "pixel-btn",
    variant === "accent" ? "pixel-btn--accent" : "",
    fab ? "pixel-btn--fab" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <button className={classes} {...props} />;
}
