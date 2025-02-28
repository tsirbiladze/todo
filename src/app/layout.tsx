import "./globals.css";
import "../styles/scrollbar.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ClientLayout from "@/components/ClientLayout";
import Script from "next/script";
import ClientProviders from "@/lib/ClientProviders";

const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Optimize font loading
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ADHD-Friendly Todo App",
  description:
    "A task management app designed specifically for individuals with ADHD",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-script" strategy="beforeInteractive">
          {`
            (function() {
              try {
                const savedTheme = localStorage.getItem('theme');
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                
                if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {
                console.error('Theme initialization failed:', e);
              }
            })();
          `}
        </Script>
      </head>
      <body className={`${inter.className} scrollbar-thin`}>
        <ClientProviders>
          <ClientLayout>{children}</ClientLayout>
        </ClientProviders>
      </body>
    </html>
  );
}
