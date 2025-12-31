import Link from "next/link"
import { ScanSearch } from "lucide-react"

import { siteConfig } from "@/config/site"

export function SiteFooter() {
    return (
        <footer className="border-t bg-background/80 backdrop-blur-lg">
            <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
                <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
                    <ScanSearch className="h-5 w-5 text-primary" />
                    <p className="text-center text-sm leading-loose md:text-left">
                        &copy; {new Date().getFullYear()}{" "}
                        <Link
                            href={siteConfig.links.twitter}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium underline underline-offset-4"
                        >
                            RealOrRender
                        </Link>
                        . All rights reserved.
                    </p>
                </div>
                <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
                    <nav className="flex gap-4">
                        <Link href="/terms" className="text-sm font-medium underline-offset-4 hover:underline">
                            Terms
                        </Link>
                        <Link href="/privacy" className="text-sm font-medium underline-offset-4 hover:underline">
                            Privacy
                        </Link>
                        <Link href="/about" className="text-sm font-medium underline-offset-4 hover:underline">
                            About
                        </Link>
                    </nav>
                </div>
            </div>
        </footer>
    )
}

