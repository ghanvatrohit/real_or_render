"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, CheckCircle, Loader2, Play, Pause, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileUploader } from "@/components/file-uploader";
import { VerificationResult } from "@/components/verification-result";

type FileWithPreview = File & { preview: string };

interface VideoResultType {
    isAI: boolean;
    confidence: number;
    averageFaceConfidence?: number;
    processedFrameCount?: number;
    firstRawFrameBase64?: string;
    firstBoxedFrameBase64?: string;
}

export default function VerifyVideoPage() {
    const [file, setFile] = useState<FileWithPreview | null>(null);
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationComplete, setVerificationComplete] = useState(false);
    const [result, setResult] = useState<VideoResultType | null>(null);
    const [progress, setProgress] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement | null>(null);

    const handleFileChange = (selectedFile: File | null) => {
        if (!selectedFile) {
            setFile(null);
            setOriginalFile(null);
            return;
        }

        setOriginalFile(selectedFile);

        const reader = new FileReader();
        reader.onloadend = () => {
            setFile({ ...selectedFile, preview: reader.result as string });
        };
        reader.readAsDataURL(selectedFile);

        setVerificationComplete(false);
        setResult(null);
        setIsPlaying(false);
        setError(null);
    };

    const handleRemoveFile = () => {
        setFile(null);
        setOriginalFile(null);
        setVerificationComplete(false);
        setResult(null);
        setIsPlaying(false);
        setError(null);
    };

    const togglePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleVerify = async () => {
        if (!originalFile) return;

        setIsVerifying(true);
        setVerificationComplete(false);
        setResult(null);
        setError(null);
        setProgress(0);

        const interval = setInterval(() => {
            setProgress((prev) => Math.min(prev + 5, 90));
        }, 250);

        try {
            const formData = new FormData();
            formData.append("file", originalFile);

            const response = await fetch("http://localhost:8000/predict_video", {
                method: "POST",
                body: formData,
            });

            clearInterval(interval);
            setProgress(100);

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.detail) {
                        if (typeof errorData.detail === 'string') {
                            errorMessage = errorData.detail;
                        } else {
                            errorMessage = JSON.stringify(errorData.detail);
                        }
                    } else if (errorData) {
                         errorMessage = JSON.stringify(errorData);
                    }
                } catch (parseError) {
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();

            const formattedResult: VideoResultType = {
                isAI: data.label === "fake",
                confidence: data.average_prediction,
                averageFaceConfidence: data.average_face_confidence ? Math.round(data.average_face_confidence * 100) : undefined,
                processedFrameCount: data.processed_frame_count,
                firstRawFrameBase64: data.first_raw_frame_base64 ? data.first_raw_frame_base64 : undefined,
                firstBoxedFrameBase64: data.first_boxed_frame_base64 ? data.first_boxed_frame_base64 : undefined,
            };

            setResult(formattedResult);
            setVerificationComplete(true);

        } catch (err) {
            clearInterval(interval);
            setProgress(0);
            console.error("Verification failed:", err);
            setError(err instanceof Error ? err.message : "An unknown error occurred");
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="relative min-h-screen flex flex-col">
            <div className="noise-bg" />
            <main className="flex-1 container max-w-6xl py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl font-bold tracking-tighter mb-4">Verify Video</h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Upload a video to determine if it's authentic or AI-generated. Our advanced detection system will analyze
                        the video frame by frame and provide a detailed report.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-card rounded-lg p-6 shadow-lg border-2 border-border"
                    >
                        <h2 className="text-2xl font-bold mb-4">Upload Video</h2>

                        {!file ? (
                            <FileUploader onFileChange={handleFileChange} accept="video/*" maxSize={50 * 1024 * 1024} />
                        ) : (
                            <div className="relative rounded-lg overflow-hidden border-2 border-dashed border-border p-2">
                                <div className="relative">
                                    <video
                                        ref={videoRef}
                                        src={file.preview}
                                        className="w-full h-auto max-h-[400px] object-contain rounded"
                                        onEnded={() => setIsPlaying(false)}
                                        controls
                                    />

                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm"
                                        onClick={togglePlayPause}
                                    >
                                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                    </Button>

                                    <Button variant="destructive" size="icon" className="absolute top-4 right-4" onClick={handleRemoveFile}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="mt-4">
                                    <p className="text-sm text-muted-foreground mb-2">
                                        {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                                    </p>

                                    {!verificationComplete && (
                                        <Button onClick={handleVerify} disabled={isVerifying} className="w-full">
                                            {isVerifying ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Verifying...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                    Verify Video
                                                </>
                                            )}
                                        </Button>
                                    )}

                                    {isVerifying && (
                                        <div className="mt-4">
                                            <Progress value={progress} className="h-2" />
                                            <p className="text-xs text-muted-foreground mt-1">Analyzing video... {progress}%</p>
                                        </div>
                                    )}

                                    {error && (
                                        <p className="mt-4 text-sm text-destructive">Error: {error}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="bg-card rounded-lg p-6 shadow-lg border-2 border-border"
                    >
                        <h2 className="text-2xl font-bold mb-4">Verification Results</h2>

                        <AnimatePresence mode="wait">
                            {/* Condition 1: Show error if verification failed */}
                            {error && (
                                <motion.div
                                    key="error-message"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed border-destructive/50 rounded-lg p-4"
                                >
                                    <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                                    <p className="text-destructive text-center font-medium">Verification Error</p>
                                    <p className="text-muted-foreground text-center max-w-xs text-sm mt-2">
                                        {error} 
                                    </p>
                                </motion.div>
                            )} 
                            {/* Condition 2: Show placeholder if no error and verification not complete */}
                            {!error && !verificationComplete && (
                                <motion.div
                                    key="no-result"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed border-border rounded-lg"
                                >
                                    <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground text-center max-w-xs">
                                        Upload a video and click "Verify" to see the results here
                                    </p>
                                </motion.div>
                            )}
                            {/* Condition 3: Show results if no error and verification is complete */}
                            {!error && verificationComplete && result && (
                                <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                                    <VerificationResult result={result} isVideo={true} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
