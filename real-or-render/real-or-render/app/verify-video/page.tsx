"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { VerificationResult } from "@/components/verification-result"

export default function VerifyVideoPage() {
  const [file, setFile] = useState<File | null>(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationComplete, setVerificationComplete] = useState(false)
  const [result, setResult] = useState(null)
  const [progress, setProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)

  const handleFileChange = (selectedFile: File) => {
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    setFile(selectedFile)
    const newPreviewUrl = URL.createObjectURL(selectedFile);
    setFilePreviewUrl(newPreviewUrl);

    setVerificationComplete(false)
    setResult(null)
    setIsPlaying(false)
  }

  const handleRemoveFile = () => {
     if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    setFile(null)
    setFilePreviewUrl(null)
    setVerificationComplete(false)
    setResult(null)
    setIsPlaying(false)
  }

  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  return (
    <div className="flex flex-col h-screen">
      <main className="flex-grow p-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4"
          >
            {!file ? (
              <FileUploader
                onFileChange={handleFileChange}
                accept="video/*"
                maxSize={50 * 1024 * 1024}
              />
            ) : (
              <div className="relative rounded-lg overflow-hidden border-2 border-dashed border-border p-2">
                <div className="relative">
                  <video
                    ref={videoRef}
                    src={filePreviewUrl || ''}
                    className="w-full h-auto max-h-[400px] object-contain rounded"
                    onEnded={() => setIsPlaying(false)}
                  />
                </div>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4"
          >
            <h2 className="text-2xl font-bold mb-4">Verification Results</h2>
            <AnimatePresence mode="wait">
              {!verificationComplete ? (
              ) : (
                <motion.div
                >
                  <VerificationResult result={result} filePreviewUrl={filePreviewUrl} isVideo />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
} 