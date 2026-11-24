import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nginap | Java Hotel",
  description: "Reservasi dan informasi kamar Java Hotel, Jakarta Selatan.",
  applicationName: "Nginap",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
