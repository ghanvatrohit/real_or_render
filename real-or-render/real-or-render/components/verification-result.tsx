"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, Download, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Define the types - Make details optional as it's dummy data
interface VerificationDetails {
    inconsistencies?: number;
    patternMatches?: number;
    frameAnalysis?: {
        totalFrames?: number;
        suspiciousFrames?: number;
    };
}

interface VerificationResultProps {
    result: {
        isAI: boolean;
        confidence: number;
        details?: VerificationDetails;
        faceConfidence?: number;
        faceBox?: [number, number, number, number];
        boxedImageBase64?: string;
        correctedOriginalBase64?: string;
        averageFaceConfidence?: number;
        processedFrameCount?: number;
        firstRawFrameBase64?: string;
        firstBoxedFrameBase64?: string;
    } | null;
    isVideo?: boolean;
}

export function VerificationResult({ result, isVideo = false }: VerificationResultProps) {
    const [showDetails, setShowDetails] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    if (!result) return null;

    const {
        isAI,
        confidence, // Raw confidence (0-1, higher means more likely fake)
        details,
        faceConfidence,
        faceBox,
        boxedImageBase64,
        correctedOriginalBase64,
        averageFaceConfidence,
        processedFrameCount,
        firstRawFrameBase64,
        firstBoxedFrameBase64
    } = result;

    // Calculate the displayed "Confidence Score" (0-100)
    // This score represents confidence in the DETECTED label.
    // If AI (fake), score is (1 - raw_confidence) * 100 (confidence in it being AI)
    // If Authentic (real), score is raw_confidence * 100 (confidence in it being Real)
    const displayConfidenceScore = isAI
        ? Math.round((1 - confidence) * 100) // Fake: Confidence in AI detection
        : Math.round(confidence * 100);      // Real: Confidence in Real detection

    const resultLabel = isAI ? "AI-Generated" : "Authentic";
    const resultDescription = isVideo
        ? (isAI ? "Our system detected patterns consistent with AI generation across video frames." : "Our system analyzed video frames and did not detect common signs of AI generation.")
        : (isAI ? "Our system detected patterns consistent with AI generation." : "Our system did not detect common signs of AI generation.");
    const resultIcon = isAI ? (
        <AlertTriangle className="mr-2 h-6 w-6 text-destructive" />
    ) : (
        <CheckCircle className="mr-2 h-6 w-6 text-green-500" />
    );
    const cardBorderClass = isAI ? "border-destructive/50" : "border-green-500/50";
    // Progress bar color still based on the result label (AI = red, Real = green)
    const progressClass = isAI ? "[&>*]:bg-destructive" : "[&>*]:bg-green-500";

    const handleDownloadReport = async () => {
        if (!result) return;

        setIsGeneratingPdf(true);

        try {
            const resultForPdf = JSON.parse(JSON.stringify(result));
            // Override the confidence score in the copy with the calculated display score
            resultForPdf.confidence = displayConfidenceScore;

            const payload = {
                result: resultForPdf, // Send the modified result object
                isVideo,
                correctedOriginalBase64, // Only relevant for image
                boxedImageBase64,        // Only relevant for image
                firstRawFrameBase64,     // Only relevant for video
                firstBoxedFrameBase64    // Only relevant for video
            };
            console.log("Sending payload to PDF API (with display confidence score):", payload);

            const response = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                let errorDetails = 'Failed to generate PDF on server';
                try {
                     const errorData = await response.json();
                     console.error("Error from PDF generation API:", errorData);
                     errorDetails = errorData.error || errorData.details || errorDetails;
                } catch (jsonError) {
                    // If the response isn't JSON, use the status text
                     errorDetails = response.statusText || errorDetails;
                     console.error("Non-JSON error response from API:", await response.text());
                }
                throw new Error(errorDetails);
            }

            const pdfBlob = await response.blob();

            const url = window.URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `RealOrRender-Analysis-${Date.now()}.pdf`);
            document.body.appendChild(link);
            link.click();
            
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Error calling PDF generation proxy API:", error);
            alert(`Failed to download PDF: ${(error as Error).message}`);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    // Calculate model confidence value for PDF (same as UI display logic)
    const modelConfidenceValueForPdf = confidence;
    const mediaType = isVideo ? "Video" : "Image";
    const timestamp = new Date().toLocaleString();

    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
                <Card className={`border-2 ${cardBorderClass}`}>
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center text-2xl">
                            {resultIcon}
                            {resultLabel} Content Detected
                        </CardTitle>
                        <CardDescription>{resultDescription}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium">Confidence Score</span>
                                <span className="text-sm font-medium">{displayConfidenceScore}%</span>
                            </div>
                            <Progress value={displayConfidenceScore} className={`h-2 ${progressClass}`} />
                        </div>

                        {/* Details Toggle Button */}
                        {(faceConfidence !== undefined || faceBox !== undefined || averageFaceConfidence !== undefined || processedFrameCount !== undefined) && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setShowDetails(!showDetails)} 
                                className="w-full justify-start px-0 text-muted-foreground hover:text-foreground"
                            >
                                {showDetails ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                                {showDetails ? "Hide Analysis Details" : "Show Analysis Details"}
                            </Button>
                        )}

                        {/* Conditional Details Section */}
                        {showDetails && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: 'auto' }} 
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="pt-2 space-y-2 text-sm"
                            >
                                <Separator />
                                {/* Image Details */}
                                {!isVideo && faceConfidence !== undefined && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Face Detection Confidence:</span>
                                        <span>{faceConfidence}%</span>
                                    </div>
                                )}
                                {!isVideo && faceBox !== undefined && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Detected Face Box (x,y,w,h):</span>
                                        <code>{`[${faceBox.join(", ")}]`}</code>
                                    </div>
                                )}
                                {/* Video Details */}
                                {isVideo && averageFaceConfidence !== undefined && (
                                     <div className="flex justify-between">
                                        <span className="text-muted-foreground">Avg. Face Detection Confidence:</span>
                                        <span>{averageFaceConfidence}%</span>
                                    </div>
                                )}
                                {isVideo && processedFrameCount !== undefined && (
                                     <div className="flex justify-between">
                                        <span className="text-muted-foreground">Frames Processed with Face:</span>
                                        <span>{processedFrameCount}</span>
                                    </div>
                                )}
                            </motion.div>
                        )}

                    </CardContent>
                    <CardFooter className="flex flex-col sm:flex-row gap-2">
                        <Button 
                            variant="outline" 
                            className="w-full" 
                            onClick={handleDownloadReport}
                            disabled={isGeneratingPdf}
                        >
                            {isGeneratingPdf ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="mr-2 h-4 w-4" />
                            )}
                            {isGeneratingPdf ? 'Generating PDF...' : 'Download Report (PDF)'}
                        </Button>
                    </CardFooter>
                </Card>

                {/* Explanation Note */}
                <div className="text-sm text-muted-foreground">
                    <p className="mb-2">
                        <strong>Note:</strong> Confidence score reflects the model's certainty based on detected face features.
                    </p>
                    <p>
                        Our technology analyzes patterns, artifacts, and inconsistencies that are typically present in AI-generated
                        content but may not be visible to the human eye.
                    </p>
                </div>
            </motion.div>
        </>
    );
}
