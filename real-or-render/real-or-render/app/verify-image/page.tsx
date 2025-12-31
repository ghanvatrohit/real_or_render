"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, X, CheckCircle, Loader2, Image as ImageIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { FileUploader } from "@/components/file-uploader"
import { VerificationResult } from "@/components/verification-result"

export default function VerifyImagePage() {
  const [file, setFile] = useState<File | null>(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null) // Will store data URL
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationComplete, setVerificationComplete] = useState(false)
  const [result, setResult] = useState(null)
  const [progress, setProgress] = useState(0)

  // Use FileReader to get Data URL for preview and PDF embedding
  const handleFileChange = (selectedFile: File) => {
    setFile(selectedFile)
    setVerificationComplete(false) // Reset verification state
    setResult(null)

    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreviewUrl(reader.result as string);
    }
    reader.readAsDataURL(selectedFile);
  }

  const handleRemoveFile = () => {
    setFile(null)
    setFilePreviewUrl(null) // Clear the data URL
    setVerificationComplete(false)
    setResult(null)
  }

  // No cleanup needed for data URL state like with object URLs

  const handleVerify = () => {
    if (!file) return

    setIsVerifying(true)
    setProgress(0)

    // Simulate verification process
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 5 // Faster progress for image
      })
    }, 100)

    // Simulate API call with timeout
    setTimeout(() => {
      clearInterval(interval)
      setProgress(100)

      // Random result for demo purposes
      const isAI = Math.random() > 0.5
      const confidence = Math.floor(Math.random() * 20) + 80 // 80-99%

      setResult({
        isAI,
        confidence,
        // No complex details needed for image example usually
        details: {
            inconsistencies: isAI ? Math.floor(Math.random() * 5) + 1 : 0,
            patternMatches: isAI ? Math.floor(Math.random() * 10) + 3 : Math.floor(Math.random() * 2),
        },
      })

      setIsVerifying(false)
      setVerificationComplete(true)
    }, 2000) // Shorter timeout for image
  }

  return (
     <div className="relative min-h-screen flex flex-col">
       <div className="noise-bg" />
       <SiteHeader />
       <main className="flex-1 container max-w-6xl py-12">
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
           className="text-center mb-12"
         >
           <h1 className="text-4xl font-bold tracking-tighter mb-4">Verify Image</h1>
           <p className="text-muted-foreground max-w-2xl mx-auto">
             Upload an image to determine if it's authentic or AI-generated. Our system will analyze the image
             for subtle artifacts and inconsistencies.
           </p>
         </motion.div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <motion.div
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.5, delay: 0.2 }}
             className="bg-card rounded-lg p-6 shadow-lg border-2 border-border"
           >
             <h2 className="text-2xl font-bold mb-4">Upload Image</h2>

             {!file ? (
               <FileUploader
                 onFileChange={handleFileChange}
                 accept="image/*" // Accept only images
                 maxSize={10 * 1024 * 1024} // 10MB limit for images
               />
             ) : (
               <div className="relative rounded-lg overflow-hidden border-2 border-dashed border-border p-2">
                 {/* Use filePreviewUrl (data URL) for img src */}
                 <img
                   src={filePreviewUrl || ''} // Use the data URL
                   alt="Preview"
                   className="w-full h-auto max-h-[400px] object-contain rounded"
                 />
                 <Button
                   variant="destructive"
                   size="icon"
                   className="absolute top-4 right-4"
                   onClick={handleRemoveFile}
                 >
                   <X className="h-4 w-4" />
                 </Button>

                 {isVerifying && (
                   <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
                     <div className="scan-animation" />
                     <div className="text-center">
                       <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                       <p>Analyzing image...</p>
                     </div>
                   </div>
                 )}

                 <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2 truncate">
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
               {!verificationComplete ? (
                  <motion.div
                     key="no-result"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed border-border rounded-lg"
                    >
                     <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                     <p className="text-muted-foreground text-center max-w-xs">
                         Upload an image and click "Verify" to see the results here
                     </p>
                 </motion.div>
               ) : (
                 <motion.div
                   key="result"
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0 }}
                   transition={{ duration: 0.5 }}
                 >
                   {/* Pass filePreviewUrl (data URL) to VerificationResult */}
                   <VerificationResult result={result} filePreviewUrl={filePreviewUrl} isVideo={false} />
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