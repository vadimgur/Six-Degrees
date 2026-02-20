import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Six Degrees — Movie Actor Connections",
  description:
    "Find the shortest path between any two movie actors through shared film appearances.",
  openGraph: {
    title: "Six Degrees",
    description: "Find the shortest path between any two movie actors.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
