"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type FileUploaderProps = {
    onFileChange: (file: File | null) => void;
    accept?: string;
    maxSize?: number;
};

export function FileUploader({ onFileChange, accept = "*/*", maxSize }: FileUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        validateAndProcessFile(files[0]);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) validateAndProcessFile(files[0]);
    };

    const validateAndProcessFile = (file: File) => {
        setError(null);

        if (!file) return;

        // Check file type
        if (accept && !file.type.match(accept.replace("*", ".*"))) {
            setError(`Invalid file type. Please upload ${accept.replace("*/", "")} files.`);
            return;
        }

        // Check file size
        if (maxSize && file.size > maxSize) {
            setError(`File is too large. Maximum size is ${(maxSize / (1024 * 1024)).toFixed(2)} MB.`);
            return;
        }

        onFileChange(file);
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-4">
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragging ? "border-primary bg-primary/5" : "border-border"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleButtonClick}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept={accept}
                    onChange={handleFileInputChange}
                />

                <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="p-3 rounded-full bg-primary/10">
                        <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-lg font-medium">Drag & drop or click to upload</p>
                        <p className="text-sm text-muted-foreground">
                            {accept === "image/*" ? "PNG, JPG, GIF up to 10MB" : "MP4, MOV, WebM up to 50MB"}
                        </p>
                    </div>
                    <Button variant="outline" type="button">
                        Select File
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
