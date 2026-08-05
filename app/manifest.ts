import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Echo",
    short_name: "Echo",
    description: "A retro pixel check-in tracker — pin your stops, track your spend.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffdcee",
    theme_color: "#ff4fa3",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
