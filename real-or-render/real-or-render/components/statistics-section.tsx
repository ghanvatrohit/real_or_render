"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { TrendingUp, Award, PieChart, AlertTriangle, ArrowUpRight, Zap, BarChart3 } from "lucide-react";

// Data
const deepfakeGrowthData = [
    { year: "2018", count: 15000 },
    { year: "2019", count: 45000 },
    { year: "2020", count: 85000 },
    { year: "2021", count: 145000 },
    { year: "2022", count: 250000 },
    { year: "2023", count: 580000 },
    { year: "2024", count: 980000 },
];

const detectionAccuracyData = [
    { year: "2018", accuracy: 68 },
    { year: "2019", accuracy: 72 },
    { year: "2020", accuracy: 78 },
    { year: "2021", accuracy: 83 },
    { year: "2022", accuracy: 87 },
    { year: "2023", accuracy: 92 },
    { year: "2024", accuracy: 97 },
];

const contentTypeData = [
    { name: "Images", value: 65, icon: "Image" },
    { name: "Videos", value: 25, icon: "Video" },
    { name: "Audio", value: 10, icon: "Audio" },
];

// Chart Configurations
const deepfakeChartConfig = {
    count: {
        label: "Deepfakes",
        color: "hsl(var(--primary))",
    },
} satisfies ChartConfig;

const accuracyChartConfig = {
    accuracy: {
        label: "Accuracy",
        color: "hsl(var(--neon-blue))",
    },
} satisfies ChartConfig;

const contentTypeChartConfig = {
    value: {
        label: "Percentage",
        color: "hsl(var(--cyber-purple))",
    },
} satisfies ChartConfig;

export function StatisticsSection() {
    const chartRef1 = useRef(null);
    const chartRef2 = useRef(null);
    const chartRef3 = useRef(null);

    const chart1InView = useInView(chartRef1, { once: true, amount: 0.3 });
    const chart2InView = useInView(chartRef2, { once: true, amount: 0.3 });
    const chart3InView = useInView(chartRef3, { once: true, amount: 0.3 });

    // Calculate growth percentage
    const lastYearGrowth = Math.round(
        ((
            deepfakeGrowthData[deepfakeGrowthData.length - 1].count -
            deepfakeGrowthData[deepfakeGrowthData.length - 2].count) /
            deepfakeGrowthData[deepfakeGrowthData.length - 2].count) *
        100,
    );

    // Calculate accuracy improvement
    const accuracyImprovement =
        detectionAccuracyData[detectionAccuracyData.length - 1].accuracy - detectionAccuracyData[0].accuracy;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div
                ref={chartRef1}
                initial={{ opacity: 0, y: 40 }}
                animate={chart1InView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="bg-card rounded-lg p-6 shadow-lg border-2 border-border relative overflow-hidden group"
            >
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl group-hover:bg-primary/10 transition-colors duration-500"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-neon-blue/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl group-hover:bg-neon-blue/10 transition-colors duration-500"></div>

                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="text-xl font-bold mb-1 flex items-center">
                            <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                            Deepfake Growth
                        </h3>
                        <p className="text-sm text-muted-foreground">The exponential rise of AI-generated content online</p>
                    </div>
                    <div className="bg-primary/10 px-3 py-1 rounded-full flex items-center">
                        <ArrowUpRight className="h-3 w-3 mr-1 text-primary" />
                        <span className="text-xs font-bold text-primary">{lastYearGrowth}% YoY</span>
                    </div>
                </div>

                {/* Key statistic callout */}
                <div className="bg-background/50 backdrop-blur-sm border border-border rounded-lg p-3 mb-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground">Total Deepfakes (2024)</p>
                        <p className="text-2xl font-bold">
                            {deepfakeGrowthData[deepfakeGrowthData.length - 1].count.toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-destructive/10 p-2 rounded-full">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                    </div>
                </div>

                <div>
                    <ChartContainer config={deepfakeChartConfig}>
                    <AreaChart data={deepfakeGrowthData}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                        <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <ChartTooltip>
                                                <ChartTooltipContent>
                                                    <div className="flex flex-col gap-2">
                                                        <p className="text-sm font-medium">{payload[0].payload.year}</p>
                                                        <p className="text-sm font-semibold">{payload[0].value.toLocaleString()} deepfakes</p>
                                                    </div>
                                                </ChartTooltipContent>
                                            </ChartTooltip>
                                        );
                                    }
                                    return null;
                                }}
                            />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke="hsl(var(--primary))"
                            fillOpacity={1}
                                fill="url(#colorCount)"
                        />
                    </AreaChart>
                    </ChartContainer>
                </div>

                {/* Infographic footer */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                    <div className="bg-background/50 backdrop-blur-sm border border-border rounded-lg p-2">
                        <p className="text-xs text-muted-foreground">Growth Rate</p>
                        <p className="text-sm font-bold text-primary">Exponential</p>
                    </div>
                    <div className="bg-background/50 backdrop-blur-sm border border-border rounded-lg p-2">
                        <p className="text-xs text-muted-foreground">Risk Level</p>
                        <p className="text-sm font-bold text-destructive">Critical</p>
                    </div>
                </div>
            </motion.div>

            <motion.div
                ref={chartRef2}
                initial={{ opacity: 0, y: 40 }}
                animate={chart2InView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="bg-card rounded-lg p-6 shadow-lg border-2 border-border relative overflow-hidden group"
            >
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl group-hover:bg-neon-blue/10 transition-colors duration-500"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl group-hover:bg-primary/10 transition-colors duration-500"></div>

                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="text-xl font-bold mb-1 flex items-center">
                            <Award className="mr-2 h-5 w-5 text-neon-blue" />
                            Detection Accuracy
                        </h3>
                        <p className="text-sm text-muted-foreground">Improvements in AI detection technology over time</p>
                    </div>
                    <div className="bg-green-500/10 px-3 py-1 rounded-full flex items-center">
                        <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" />
                        <span className="text-xs font-bold text-green-500">+{accuracyImprovement}pts</span>
                    </div>
                </div>

                {/* Key statistic callout */}
                <div className="bg-background/50 backdrop-blur-sm border border-border rounded-lg p-3 mb-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground">Current Accuracy</p>
                        <p className="text-2xl font-bold">{detectionAccuracyData[detectionAccuracyData.length - 1].accuracy}%</p>
                    </div>
                    <div className="bg-green-500/10 p-2 rounded-full">
                        <Zap className="h-6 w-6 text-green-500" />
                    </div>
                </div>

                <div>
                    <ChartContainer config={accuracyChartConfig}>
                    <LineChart data={detectionAccuracyData}>
                        <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" domain={[60, 100]} />
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <ChartTooltip>
                                                <ChartTooltipContent>
                                                    <div className="flex flex-col gap-2">
                                                        <p className="text-sm font-medium">{payload[0].payload.year}</p>
                                                        <p className="text-sm font-semibold">{payload[0].value}% accuracy</p>
                                                    </div>
                                                </ChartTooltipContent>
                                            </ChartTooltip>
                                        );
                                    }
                                    return null;
                                }}
                            />
                        <Line
                            type="monotone"
                            dataKey="accuracy"
                            stroke="hsl(var(--neon-blue))"
                            strokeWidth={2}
                            dot={{ r: 4, fill: "hsl(var(--neon-blue))" }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                    </ChartContainer>
                </div>

                {/* Infographic footer */}
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="bg-background/50 backdrop-blur-sm border border-border rounded-lg p-2">
                        <p className="text-xs text-muted-foreground">2018</p>
                        <p className="text-sm font-bold">{detectionAccuracyData[0].accuracy}%</p>
                    </div>
                    <div className="bg-background/50 backdrop-blur-sm border border-border rounded-lg p-2">
                        <p className="text-xs text-muted-foreground">Improvement</p>
                        <p className="text-sm font-bold text-neon-blue">+{accuracyImprovement}%</p>
                    </div>
                    <div className="bg-background/50 backdrop-blur-sm border border-border rounded-lg p-2">
                        <p className="text-xs text-muted-foreground">2024</p>
                        <p className="text-sm font-bold text-green-500">
                            {detectionAccuracyData[detectionAccuracyData.length - 1].accuracy}%
                        </p>
                    </div>
                </div>
            </motion.div>

            <motion.div
                ref={chartRef3}
                initial={{ opacity: 0, y: 40 }}
                animate={chart3InView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="bg-card rounded-lg p-6 shadow-lg border-2 border-border relative overflow-hidden md:col-span-2 lg:col-span-1 group"
            >
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-purple/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl group-hover:bg-cyber-purple/10 transition-colors duration-500"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-highlight/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl group-hover:bg-highlight/10 transition-colors duration-500"></div>

                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="text-xl font-bold mb-1 flex items-center">
                            <PieChart className="mr-2 h-5 w-5 text-cyber-purple" />
                            AI Content Types
                        </h3>
                        <p className="text-sm text-muted-foreground">Distribution of AI-generated content by media type</p>
                    </div>
                    <div className="bg-cyber-purple/10 px-3 py-1 rounded-full flex items-center">
                        <BarChart3 className="h-3 w-3 mr-1 text-cyber-purple" />
                        <span className="text-xs font-bold text-cyber-purple">Distribution</span>
                    </div>
                </div>

                {/* Visual representation of percentages */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    {contentTypeData.map((item, index) => (
                        <div
                            key={index}
                            className="bg-background/50 backdrop-blur-sm border border-border rounded-lg p-3 text-center"
                        >
                            <div
                                className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center"
                                style={{
                                    background: `conic-gradient(hsl(var(--cyber-purple)) ${item.value}%, transparent ${item.value}%)`,
                                }}
                            >
                                <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                                    <span className="text-sm font-bold">{item.value}%</span>
                                </div>
                            </div>
                            <p className="text-xs font-medium">{item.name}</p>
                        </div>
                    ))}
                </div>

                <div>
                    <ChartContainer config={contentTypeChartConfig}>
                        <BarChart data={contentTypeData}>
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                            <YAxis stroke="hsl(var(--muted-foreground))" />
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <ChartTooltip>
                                                <ChartTooltipContent>
                                                    <div className="flex flex-col gap-2">
                                                        <p className="text-sm font-medium">{payload[0].payload.name}</p>
                                                        <p className="text-sm font-semibold">{payload[0].value}% of content</p>
                                                    </div>
                                                </ChartTooltipContent>
                                            </ChartTooltip>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="value" fill="hsl(var(--cyber-purple))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ChartContainer>
                </div>

                {/* Infographic footer */}
                <div className="mt-4 bg-background/50 backdrop-blur-sm border border-border rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Key Insight</p>
                    <p className="text-sm">
                        Images remain the most common form of AI-generated content, but video deepfakes are growing at a faster rate
                        year over year.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
