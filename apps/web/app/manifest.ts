import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DigiX Lab",
    short_name: "DigiX",
    description: "Nền tảng thiết kế và vận hành quy trình số DigiX",
    start_url: "/",
    display: "standalone",
    background_color: "#112B45",
    theme_color: "#112B45",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
