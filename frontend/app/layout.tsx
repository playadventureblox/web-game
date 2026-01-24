import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";
import { PresenceProvider } from "@/contexts/PresenceContext";

export const metadata: Metadata = {
  title: "AdventureBlox",
  description: "Gaming platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey="adventureblox-theme"
        >
          <PresenceProvider>
            {children}
          </PresenceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

