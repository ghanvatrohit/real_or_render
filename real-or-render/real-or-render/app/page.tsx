"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform, useInView } from "framer-motion"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ArrowRight, ScanSearch, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { StatisticsSection } from "@/components/statistics-section"
import { BenefitsSection } from "@/components/benefits-section"
import { HeroBackground } from "@/components/hero-background"

export default function HomePage() {
  const heroRef = useRef(null)
  const statsRef = useRef(null)
  const benefitsRef = useRef(null)
  const ctaRef = useRef(null)

  const heroInView = useInView(heroRef, { once: false })
  const statsInView = useInView(statsRef, { once: true, amount: 0.3 })
  const benefitsInView = useInView(benefitsRef, { once: true, amount: 0.3 })
  const ctaInView = useInView(ctaRef, { once: true, amount: 0.5 })

  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95])
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 50])

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: statsRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
      },
    })

    tl.fromTo(".parallax-element", { y: 0 }, { y: -100, ease: "none" })

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    }
  }, [])

  return (
      <div className="relative min-h-screen">
        <div className="noise-bg" />
        <main className="flex-1">
          {/* Hero Section */}
          <section
              ref={heroRef}
              className="relative overflow-hidden min-h-[90vh] flex items-center justify-center cyber-grid"
          >
            <HeroBackground />

            <motion.div
                className="container relative z-10 px-4 py-32 md:py-40 lg:py-48"
                style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
            >
              <div className="flex flex-col items-center text-center space-y-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium"
                >
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                  Cutting-edge AI detection technology
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tighter glow-text max-w-3xl"
                >
                  Distinguish Reality from AI Renderings
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="max-w-[700px] text-muted-foreground md:text-xl"
                >
                  Our advanced AI detection system analyzes images and videos to determine if they're authentic or
                  AI-generated with industry-leading accuracy.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="flex flex-col sm:flex-row gap-4 mt-8"
                >
                  <Button asChild size="lg" className="animate-pulse-glow">
                    <Link href="/verify/image" className="group">
                      <ScanSearch className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                      Verify Image
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-2">
                    <Link href="/verify/video" className="group">
                      <ScanSearch className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                      Verify Video
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </section>

          {/* Statistics Section */}
          <section ref={statsRef} className="py-20 md:py-32 bg-secondary/50 relative overflow-hidden">
            <div className="container px-4">
              <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={statsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.8 }}
                  className="text-center mb-16"
              >
                <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-4">
                  The Growing Challenge of Deepfakes
                </h2>
                <p className="max-w-[700px] mx-auto text-muted-foreground md:text-lg">
                  As AI technology advances, distinguishing between real and synthetic media becomes increasingly
                  difficult.
                </p>
              </motion.div>

              <StatisticsSection />
            </div>
          </section>

          {/* Benefits Section */}
          <section ref={benefitsRef} className="py-20 md:py-32 relative overflow-hidden">
            <div className="container px-4">
              <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={benefitsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.8 }}
                  className="text-center mb-16"
              >
                <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-4">Why Choose RealOrRender</h2>
                <p className="max-w-[700px] mx-auto text-muted-foreground md:text-lg">
                  Our platform offers unparalleled accuracy and ease of use for detecting AI-generated content.
                </p>
              </motion.div>

              <BenefitsSection />
            </div>
          </section>

          {/* CTA Section */}
          <section ref={ctaRef} className="py-20 md:py-32 bg-secondary/50 relative overflow-hidden">
            <div className="container px-4">
              <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={ctaInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.8 }}
                  className="max-w-3xl mx-auto text-center"
              >
                <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-6">Ready to Verify Your Content?</h2>
                <p className="mb-8 text-muted-foreground md:text-lg">
                  Start using our advanced AI detection technology today and gain confidence in the authenticity of your
                  media.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="animate-pulse-glow">
                    <Link href="/verify/image">
                      <Upload className="mr-2 h-5 w-5" />
                      Verify Image
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-2">
                    <Link href="/verify/video">
                      <Upload className="mr-2 h-5 w-5" />
                      Verify Video
                    </Link>
                  </Button>
                </div>
              </motion.div>
            </div>
          </section>
        </main>
      </div>
  )
}

