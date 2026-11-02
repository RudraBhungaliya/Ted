import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Ted — Meeting Notes & Conversational Copilot",
  description: "Lightweight, distraction-free conversational assistant and real-time meeting notes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAF9F6] text-stone-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
