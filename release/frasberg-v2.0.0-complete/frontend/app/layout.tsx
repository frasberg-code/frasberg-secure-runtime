import "./globals.css";
import { createClient } from "@/lib/supabase";

export const metadata = {
  title: "Emerald Orbit",
  description: "Unified generation platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  return (
    <html lang="en">
      <body
        style={{
          background: "#000",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          margin: 0,
          padding: 0,
        }}
      >
        {children}
      </body>
    </html>
  );
}
