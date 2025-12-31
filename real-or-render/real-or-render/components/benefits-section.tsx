"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { CheckCircle, Shield, Zap, BarChart4, Clock, Lock } from "lucide-react"

const benefits = [
    {
        icon: <Zap className="h-10 w-10 text-primary" />,
        title: "High-Speed Analysis",
        description: "Get results in seconds, not minutes, with our optimized processing algorithms.",
    },
    {
        icon: <Shield className="h-10 w-10 text-primary" />,
        title: "Industry-Leading Accuracy",
        description: "Our detection system achieves 97% accuracy across various types of AI-generated content.",
    },
    {
        icon: <BarChart4 className="h-10 w-10 text-primary" />,
        title: "Detailed Reports",
        description: "Receive comprehensive analysis with confidence scores and detection markers.",
    },
    {
        icon: <CheckCircle className="h-10 w-10 text-primary" />,
        title: "Easy to Use",
        description: "Simple drag-and-drop interface makes verification accessible to everyone.",
    },
    {
        icon: <Clock className="h-10 w-10 text-primary" />,
        title: "Always Up-to-Date",
        description: "Our models are continuously trained on the latest AI generation techniques.",
    },
    {
        icon: <Lock className="h-10 w-10 text-primary" />,
        title: "Privacy Focused",
        description: "Your uploads are processed securely and never stored without permission.",
    },
]

export function BenefitsSection() {
    const containerRef = useRef(null)
    const isInView = useInView(containerRef, { once: true, amount: 0.2 })

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
            },
        },
    }

    return (
        <motion.div
            ref={containerRef}
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
            {benefits.map((benefit, index) => (
                <motion.div
                    key={index}
                    variants={itemVariants}
                    className="bg-card rounded-lg p-6 shadow-lg border-2 border-border hover:border-primary/50 transition-colors duration-300 group"
                >
                    <div className="mb-4 p-3 rounded-full bg-primary/10 inline-block group-hover:bg-primary/20 transition-colors duration-300">
                        {benefit.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">
                        {benefit.title}
                    </h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                </motion.div>
            ))}
        </motion.div>
    )
}

