"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ScanSearch } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { buttonVariants } from "@/components/ui/button"

export function SiteHeader() {
    return (
        <header className="sticky top-0 z-50 w-full backdrop-blur-lg bg-background/80 border-b">
            <div className="container flex h-16 items-center">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mr-4 flex"
                >
                    <Link href="/" className="flex items-center space-x-2">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center justify-center rounded-md bg-primary/10 p-1"
                        >
                            <ScanSearch className="h-6 w-6 text-primary" />
                        </motion.div>
                        <span className="font-sans font-bold text-xl tracking-wider glow-text">RealOrRender</span>
                    </Link>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex flex-1 items-center justify-end space-x-4"
                >
                    <nav className="flex items-center space-x-2">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Link
                                href="/verify/image"
                                className={cn(
                                    buttonVariants({ variant: "ghost", size: "sm" }),
                                    "text-sm font-medium transition-colors hover:text-primary",
                                )}
                            >
                                Verify Image
                            </Link>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Link
                                href="/verify/video"
                                className={cn(
                                    buttonVariants({ variant: "ghost", size: "sm" }),
                                    "text-sm font-medium transition-colors hover:text-primary",
                                )}
                            >
                                Verify Video
                            </Link>
                        </motion.div>
                        <ThemeToggle />
                    </nav>
                </motion.div>
            </div>
        </header>
    )
}

