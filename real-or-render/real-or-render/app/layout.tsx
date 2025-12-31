import { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@/components/analytics";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import { siteConfig } from "@/config/site";
import { fontSans, fontDisplay } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import "@/app/globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Metadata, Viewport } from "next";

export const metadata: Metadata = {
    title: {
        default: siteConfig.name,
        template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    keywords: [
        "AI detection",
        "deepfake detection",
        "image verification",
        "video verification",
        "AI-generated content",
    ],
    authors: [
        {
            name: "RealOrRender",
            url: "https://realorrender.com",
        },
    ],
    creator: "RealOrRender",
    openGraph: {
        type: "website",
        locale: "en_US",
        url: siteConfig.url,
        title: siteConfig.name,
        description: siteConfig.description,
        siteName: siteConfig.name,
    },
    twitter: {
        card: "summary_large_image",
        title: siteConfig.name,
        description: siteConfig.description,
        creator: "@realorrender",
    },
    icons: {
        icon: "/favicon.ico",
        shortcut: "/favicon-16x16.png",
    },
    manifest: `${siteConfig.url}/site.webmanifest`,
};

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "white" },
        { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    ],
};

// ✅ Explicitly type the props
interface RootLayoutProps {
    children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="en" suppressHydrationWarning>
        <head>
            <title>{siteConfig.name}</title>
            <meta name="description" content={siteConfig.description} />
        </head>
        <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable, fontDisplay.variable)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <div className="relative flex min-h-screen flex-col">
                <SiteHeader />
                <main className="flex-1">{children}</main>
                <SiteFooter />
            </div>
            <TailwindIndicator />
        </ThemeProvider>
        <Analytics />
        </body>
        </html>
    );
}
