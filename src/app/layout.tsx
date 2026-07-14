import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppearanceProvider } from "@/components/appearance-provider";
import { Toaster } from "@/components/ui/sonner";
import { APPEARANCE_STORAGE_KEY } from "@/lib/appearance/store";

/**
 * Inline bootstrap that reads the persisted appearance from localStorage
 * and applies data-palette / data-style / data-density to <html> before
 * the first paint, preventing a flash of the default palette.
 */
const appearanceBootstrap = `(function(){try{var raw=localStorage.getItem(${JSON.stringify(
  APPEARANCE_STORAGE_KEY,
)});if(!raw)return;var p=JSON.parse(raw);if(!p||typeof p!=="object")return;var h=document.documentElement;if(p.palette)h.dataset.palette=p.palette;if(p.style)h.dataset.style=p.style;if(p.density)h.dataset.density=p.density;}catch(e){}})();`;

const geistSans = localFont({
  src: "./fonts/GeistLatinVariable.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoLatinVariable.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TechFix Pro - Taller de Reparación de Laptops",
  description: "Sistema de gestión para taller de reparación y venta de laptops. Inventario, clientes, reparaciones, compras y ventas.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: appearanceBootstrap }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppearanceProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
          </AppearanceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
