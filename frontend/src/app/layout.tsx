import type { Metadata } from "next";
import type {} from "tailwindcss"; // ensure tailwind types are loaded
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "AuthApp",
  description: "Secure authentication with Next.js and Node.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
