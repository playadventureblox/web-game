import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";
import { RealtimeProvider } from "@/contexts/RealtimeContext";
import GlobalChatWidget from "./components/GlobalChatWidget";

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
          <RealtimeProvider>
            {children}
            <GlobalChatWidget />
          </RealtimeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

