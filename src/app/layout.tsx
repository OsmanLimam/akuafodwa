import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Playfair_Display, Inter, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { db } from "@/lib/db";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#1b5e20",
  width: "device-width",
  initialScale: 1,
};

// Static metadata every regular visit gets.
const staticMetadata: Metadata = {
  title: "AkuafoDwa: Ghana's Farmers Market Online",
  description:
    "AkuafoDwa is Ghana's agricultural marketplace. Farmers and traders list produce and livestock, buyers make offers, negotiate and deal. Fresh from the farm to your door.",
  keywords: [
    "Ghana",
    "agriculture",
    "marketplace",
    "farmers",
    "produce",
    "livestock",
    "AkuafoDwa",
    "farm market",
  ],
  authors: [{ name: "AkuafoDwa" }],
  applicationName: "AkuafoDwa",
  manifest: "/manifest.webmanifest",
  icons: {
    // Versioned URL (?v=3) so browsers drop any previously cached favicon artwork.
    icon: "/icons/favicon.png?v=3",
    shortcut: "/icons/favicon.png?v=3",
    apple: "/icons/apple-touch-icon.png?v=3",
  },
  appleWebApp: {
    capable: true,
    title: "AkuafoDwa",
    statusBarStyle: "black-translucent",
  },
};

/**
 * WhatsApp share cards: share links look like https://host/?listing=<id>.
 * middleware.ts forwards the id via the x-share-listing header, and this
 * emits per-listing Open Graph tags (real photo, title, cedi price) so the
 * link unfurls as a rich card in WhatsApp/Telegram/X previews.
 */
export async function generateMetadata(): Promise<Metadata> {
  try {
    const h = await headers();
    const listingId = h.get("x-share-listing");
    if (!listingId) return staticMetadata;

    const listing = await db.listing.findUnique({
      where: { id: listingId },
      select: {
        title: true,
        description: true,
        price: true,
        unit: true,
        region: true,
        city: true,
        status: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
      },
    });
    if (!listing || listing.status === "TAKEN_DOWN") return staticMetadata;

    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? (/^(localhost|127\.|0\.)/.test(host) ? "http" : "https");
    const origin = `${proto}://${host}`;

    const price = `GH\u20b5${listing.price % 1 === 0 ? listing.price : listing.price.toFixed(2)} / ${listing.unit}`;
    const where = listing.city ? `${listing.city}, ${listing.region}` : listing.region;
    const title = `${listing.title} \u2014 ${price}`;
    const description = `${where} \u00b7 AkuafoDwa, Ghana's farmers market online. ${listing.description.slice(0, 150)}`.trim();
    const image = listing.images[0]
      ? [{ url: `${origin}${listing.images[0].url}`, width: 1200, height: 900, alt: listing.title }]
      : undefined;

    return {
      ...staticMetadata,
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${origin}/?listing=${listingId}`,
        siteName: "AkuafoDwa",
        type: "website",
        images: image,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: image?.map((i) => i.url),
      },
    };
  } catch {
    return staticMetadata;
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${playfair.variable} ${inter.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
