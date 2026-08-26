import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  style: ["normal", "italic"],
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Jejak.log — Album Eksplorasi Digital",
    template: "%s — Jejak.log",
  },
  description:
    "Catat tempat yang sudah kamu jelajahi lengkap dengan foto, video, dan pin di peta. Arsip personal, bukan itinerary.",
};

const themeInit = `
(function () {
  try {
    var t = localStorage.getItem("jejak-theme");
    if (!t) {
      t = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    document.documentElement.dataset.theme = t;
    if (t === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body
        className={`${geist.variable} ${newsreader.variable} ${geistMono.variable} font-sans min-h-screen bg-background text-foreground antialiased transition-colors duration-300`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
