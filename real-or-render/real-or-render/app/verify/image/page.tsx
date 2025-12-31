"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, CheckCircle, Loader2, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileUploader } from "@/components/file-uploader";
import { VerificationResult } from "@/components/verification-result";

type FileWithPreview = File & { preview: string };

// Update result state type to include boxed image data
interface ImageResultType {
    isAI: boolean;
    confidence: number;
    faceConfidence?: number;
    faceBox?: [number, number, number, number];
    boxedImageBase64?: string;
    correctedOriginalBase64?: string; // Add field for corrected original image
}

export default function VerifyImagePage() {
    // State for preview and file info
    const [file, setFile] = useState<FileWithPreview | null>(null);
    // State specifically for the raw File object for upload
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationComplete, setVerificationComplete] = useState(false);
    // Use the updated type here
    const [result, setResult] = useState<ImageResultType | null>(null);
    const [progress, setProgress] = useState(0); // Keep for UI feedback
    const [error, setError] = useState<string | null>(null); // Add error state

    const handleFileChange = (selectedFile: File | null) => {
        if (!selectedFile) {
            setFile(null);
            setOriginalFile(null); // Clear original file too
            return;
        }

        // Set the raw file for upload
        setOriginalFile(selectedFile);

        const reader = new FileReader();
        reader.onloadend = () => {
            // Set the preview state
            setFile({ ...selectedFile, preview: reader.result as string });
        };
        reader.readAsDataURL(selectedFile);

        // Reset states
        setVerificationComplete(false);
        setResult(null);
        setError(null); // Also clear error on new file
    };

    const handleRemoveFile = () => {
        setFile(null);
        setOriginalFile(null); // Clear original file too
        setVerificationComplete(false);
        setResult(null);
        setError(null);
    };

    const handleVerify = async () => {
        // Use originalFile for the check and upload
        if (!originalFile) return;

        setIsVerifying(true);
        setVerificationComplete(false);
        setResult(null);
        setError(null);
        setProgress(0); // Reset progress

        // Simulate progress during API call
        const interval = setInterval(() => {
            setProgress((prev) => Math.min(prev + 10, 90)); // Simulate progress up to 90%
        }, 200);

        try {
            const formData = new FormData();
            // Append the original File object
            formData.append("file", originalFile);

            const response = await fetch("http://localhost:8000/predict_image", {
                method: "POST",
                body: formData,
            });

            clearInterval(interval); // Stop simulated progress
            setProgress(100); // Set progress to 100%

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.detail) {
                        if (typeof errorData.detail === 'string') {
                            errorMessage = errorData.detail;
                        } else {
                            // Try to stringify if it's an object/array
                            errorMessage = JSON.stringify(errorData.detail);
                        }
                    } else if (errorData) {
                         // If no detail, stringify the whole error data
                        errorMessage = JSON.stringify(errorData);
                    }
                } catch (parseError) {
                    // If parsing error response fails, use the raw status text
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();

            // Store the raw prediction score (0-1, higher = more likely fake)
            const formattedResult: ImageResultType = {
                isAI: data.label === "fake",
                confidence: data.prediction, // Store raw score
                faceConfidence: data.face_confidence ? Math.round(data.face_confidence * 100) : undefined,
                faceBox: data.face_box,
                boxedImageBase64: data.boxed_image_base64,
                correctedOriginalBase64: data.corrected_original_base64,
            };

            setResult(formattedResult);
            setVerificationComplete(true);

        } catch (err) {
            clearInterval(interval); // Stop progress on error
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
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-12">
                    <h1 className="text-4xl font-bold tracking-tighter mb-4">Verify Image</h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Upload an image to determine if it's authentic or AI-generated. Our advanced detection system will analyze
                        the image and provide a detailed report.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Upload Image Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-card rounded-lg p-6 shadow-lg border-2 border-border"
                    >
                        <h2 className="text-2xl font-bold mb-4">Upload Image</h2>

                        {!file ? (
                            <FileUploader onFileChange={handleFileChange} accept="image/*" maxSize={10 * 1024 * 1024} />
                        ) : (
                            <div className="relative rounded-lg overflow-hidden border-2 border-dashed border-border p-2">
                                <img src={file.preview} alt="Preview" className="w-full h-auto max-h-[400px] object-contain rounded" />
                                <Button variant="destructive" size="icon" className="absolute top-4 right-4" onClick={handleRemoveFile}>
                                    <X className="h-4 w-4" />
                                </Button>

                                <div className="mt-4">
                                    <p className="text-sm text-muted-foreground mb-2">
                                        {file?.name} ({((file?.size ?? 0) / (1024 * 1024)).toFixed(2)} MB)
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
                                                    Verify Image
                                                </>
                                            )}
                                        </Button>
                                    )}

                                    {isVerifying && (
                                        <div className="mt-4">
                                            <Progress value={progress} className="h-2" />
                                            <p className="text-xs text-muted-foreground mt-1">Analyzing image... {progress}%</p>
                                        </div>
                                    )}

                                    {/* Add error display */}
                                    {error && (
                                        <p className="mt-4 text-sm text-destructive">Error: {error}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Verification Results Section */}
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
                                        Upload an image and click "Verify" to see the results here
                                    </p>
                                </motion.div>
                            )}
                            {/* Condition 3: Show results if no error and verification is complete */}
                            {!error && verificationComplete && result && (
                                <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                                    {/* Pass correctedOriginalBase64 (placeholder for now, will use in VerificationResult) */}
                                    <VerificationResult result={result} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
