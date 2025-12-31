import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Buffer } from 'buffer';

// Define colors based on the example (approximated)
const colors = {
    titleBlue: rgb(0, 0.53, 0.71),
    resultRed: rgb(0.863, 0.208, 0.271),
    resultGreen: rgb(0.1, 0.6, 0.1), // Approximated green
    darkGray: rgb(0.3, 0.3, 0.3), // For body text
    lightGray: rgb(0.588, 0.588, 0.588), // For timestamp, captions, footer
    lineGray: rgb(0.78, 0.78, 0.78)
};

// Removed PDF_GENERATOR_URL constant

// Define the expected structure of the result object from the request body
interface VerificationResultData {
    isAI: boolean;
    confidence: number;
    faceConfidence?: number;
    faceBox?: [number, number, number, number];
    averageFaceConfidence?: number;
    processedFrameCount?: number;
}

interface RequestBody {
    result: VerificationResultData;
    isVideo?: boolean;
    timestamp?: string;
    correctedOriginalBase64?: string;
    boxedImageBase64?: string;
    firstRawFrameBase64?: string;
    firstBoxedFrameBase64?: string;
}

export async function POST(request: Request) {
    console.log("--- PDF Generation API Route Hit (v5 Video Side-by-Side) ---");
    let requestBody: RequestBody;

    try {
        requestBody = await request.json();
        const { 
            result, 
            isVideo, 
            correctedOriginalBase64, 
            boxedImageBase64, 
            firstRawFrameBase64,
            firstBoxedFrameBase64
        } = requestBody;

        if (!result) {
            throw new Error("Missing 'result' data in request body.");
        }

        // --- PDF Generation Logic using pdf-lib ---
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage(); // Default A4 size
        const { width, height } = page.getSize();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        const margin = 50;
        const contentWidth = width - 2 * margin;
        let y = height - margin; // Starting Y position

        // Log received data relevant to video frame display
        console.log(`PDF Route: isVideo = ${isVideo}`);
        console.log(`PDF Route: firstRawFrameBase64 exists = ${!!firstRawFrameBase64}`);
        console.log(`PDF Route: firstBoxedFrameBase64 exists = ${!!firstBoxedFrameBase64}`);

        // 1. Title
        const title = 'RealOrRender Analysis Report';
        const titleSize = 20; // Slightly smaller than example for better fit
        const titleWidth = boldFont.widthOfTextAtSize(title, titleSize);
        page.drawText(title, {
            x: (width - titleWidth) / 2, // Center align
            y: y,
            size: titleSize,
            font: boldFont,
            color: colors.titleBlue,
        });
        y -= (titleSize + 15); // Space after title

        // 2. Timestamp
        const timestamp = requestBody.timestamp || new Date().toISOString();
        const dateString = `Generated on: ${new Date(timestamp).toLocaleString()}`;
        const dateSize = 9;
        const dateWidth = font.widthOfTextAtSize(dateString, dateSize);
        page.drawText(dateString, { 
            x: (width - dateWidth) / 2, // Center align
            y: y, 
            size: dateSize, 
            font: font, 
            color: colors.lightGray
        });
        y -= (dateSize + 10); // Space after date

        // 3. Separator Line
        page.drawLine({
            start: { x: margin, y: y },
            end: { x: width - margin, y: y },
            thickness: 1,
            color: colors.lineGray,
        });
        y -= 25; // Space after line

        // 4. Analysis Result Section
        page.drawText('Analysis Result:', { x: margin, y: y, size: 14, font: boldFont, color: colors.darkGray });
        y -= 20;

        // Result Label (AI or Authentic)
        const resultLabel = result.isAI ? "AI-GENERATED CONTENT" : "AUTHENTIC CONTENT";
        const resultLabelSize = 12;
        const resultColor = result.isAI ? colors.resultRed : colors.resultGreen;
        page.drawText(resultLabel, {
            x: margin + 15, // Indent
            y: y,
            size: resultLabelSize,
            font: boldFont, // Example shows bold/larger label
            color: resultColor,
        });
        y -= (resultLabelSize + 8);

        // Confidence Score
        const displayedConfidence = result.confidence;
        page.drawText(`Confidence Score: ${displayedConfidence}% ${isVideo ? '(Avg. across frames)' : ''}`, { x: margin + 15, y: y, size: 10, font: font, color: colors.darkGray });
        y -= 15;

        // Conditional Details based on isVideo
        if (isVideo) {
            // Video Details
            if (result.averageFaceConfidence !== undefined) {
                page.drawText(`Avg. Face Detection Confidence: ${result.averageFaceConfidence}%`, { x: margin + 15, y: y, size: 10, font: font, color: colors.darkGray });
                y -= 15;
            }
            if (result.processedFrameCount !== undefined) {
                page.drawText(`Frames Processed with Face: ${result.processedFrameCount}`, { x: margin + 15, y: y, size: 10, font: font, color: colors.darkGray });
                y -= 15;
            }
        } else {
            // Image Details
            if (result.faceConfidence !== undefined) {
                page.drawText(`Face Detection Confidence: ${result.faceConfidence}%`, { x: margin + 15, y: y, size: 10, font: font, color: colors.darkGray });
                y -= 15;
            }
            if (result.faceBox !== undefined) {
                page.drawText(`Detected Face Box (x,y,w,h): [${result.faceBox.join(", ")}]`, { x: margin + 15, y: y, size: 10, font: font, color: colors.darkGray });
                y -= 15;
            }
        }
        y -= 15; // Extra space after results section

        // --- Image/Frame Section (Conditional Display) ---
        let imageEndY = y;
        console.log(`--- Checking Image/Frame Display Logic ---`);
        console.log(`isVideo: ${isVideo}`);
        console.log(`firstRawFrameBase64 exists: ${!!firstRawFrameBase64}`);
        console.log(`firstBoxedFrameBase64 exists: ${!!firstBoxedFrameBase64}`);
        console.log(`correctedOriginalBase64 exists: ${!!correctedOriginalBase64}`);
        console.log(`boxedImageBase64 exists: ${!!boxedImageBase64}`);

        if (isVideo) {
            console.log("Condition: isVideo. Checking for video frames...");
            if (firstRawFrameBase64 && firstBoxedFrameBase64) {
                console.log("Attempting to embed side-by-side video frames...");
                let embeddedRawFrame: any = null;
                let embeddedBoxedFrame: any = null;
                try {
                    const base64String = firstRawFrameBase64.split(',')[1];
                    const imageBytes = Buffer.from(base64String, 'base64');
                    if (firstRawFrameBase64.startsWith('data:image/jpeg') || firstRawFrameBase64.startsWith('data:image/jpg')) {
                        embeddedRawFrame = await pdfDoc.embedJpg(imageBytes);
                    } else if (firstRawFrameBase64.startsWith('data:image/png')) {
                        embeddedRawFrame = await pdfDoc.embedPng(imageBytes);
                    }
                    if(embeddedRawFrame) console.log("Raw frame embedded.");
                } catch (err) { console.error("Error embedding raw frame:", err); }
                try {
                    const base64String = firstBoxedFrameBase64.split(',')[1];
                    const imageBytes = Buffer.from(base64String, 'base64');
                    if (firstBoxedFrameBase64.startsWith('data:image/jpeg') || firstBoxedFrameBase64.startsWith('data:image/jpg')) {
                        embeddedBoxedFrame = await pdfDoc.embedJpg(imageBytes);
                    } else if (firstBoxedFrameBase64.startsWith('data:image/png')) {
                        embeddedBoxedFrame = await pdfDoc.embedPng(imageBytes);
                    }
                    if(embeddedBoxedFrame) console.log("Boxed frame embedded.");
                } catch (err) { console.error("Error embedding boxed frame:", err); }

                if (embeddedRawFrame && embeddedBoxedFrame) {
                    console.log("Both frames embedded, drawing side-by-side...");
                    const spacing = 10;
                    const maxSingleImageWidth = (contentWidth - spacing) / 2;
                    const maxImageHeight = height * 0.30;
                    const rawOriginalDims = embeddedRawFrame.scale(1);
                    const rawWidthScale = maxSingleImageWidth / rawOriginalDims.width;
                    const rawHeightScale = maxImageHeight / rawOriginalDims.height;
                    const rawFinalScale = Math.min(1, rawWidthScale, rawHeightScale);
                    const rawFrameDims = embeddedRawFrame.scale(rawFinalScale);
                    const boxedFrameDims = embeddedBoxedFrame.scale(rawFinalScale);
                    const drawHeight = Math.max(rawFrameDims.height, boxedFrameDims.height);
                    const imageY = y - drawHeight;
                    imageEndY = imageY;
                    if (imageY < margin + 50) {
                        console.warn("Frames position might be too low, skipping draw.");
                    } else {
                        const rawFrameX = margin;
                        page.drawImage(embeddedRawFrame, { x: rawFrameX, y: imageY, width: rawFrameDims.width, height: rawFrameDims.height });
                        const boxedFrameX = rawFrameX + rawFrameDims.width + spacing;
                        page.drawImage(embeddedBoxedFrame, { x: boxedFrameX, y: imageY, width: boxedFrameDims.width, height: boxedFrameDims.height });
                        const captionSize = 9;
                        const captionY = imageY - captionSize - 5;
                        const caption1 = 'Representative Frame (Original)';
                        const caption2 = 'Representative Frame (Boxed)';
                        const caption1Width = font.widthOfTextAtSize(caption1, captionSize);
                        const caption2Width = font.widthOfTextAtSize(caption2, captionSize);
                        page.drawText(caption1, { x: rawFrameX + (rawFrameDims.width - caption1Width) / 2, y: captionY, size: captionSize, font: font, color: colors.lightGray });
                        page.drawText(caption2, { x: boxedFrameX + (boxedFrameDims.width - caption2Width) / 2, y: captionY, size: captionSize, font: font, color: colors.lightGray });
                        imageEndY = captionY;
                        console.log("Drew side-by-side video frames and captions.");
                    }
                } else {
                     console.log("One or both video frames failed to embed.");
                     y -= 10;
                }
            } else {
                 console.log("Skipping video frame display: required base64 data missing.");
                 y -= 10;
            }
        } else if (!isVideo) {
             console.log("Condition: !isVideo. Checking for image data...");
             if (correctedOriginalBase64 && boxedImageBase64) {
                console.log("Attempting to embed side-by-side images...");
                let embeddedPreviewImage: any = null;
                let embeddedBoxedImage: any = null;
                try {
                    const base64String = correctedOriginalBase64.split(',')[1];
                    const imageBytes = Buffer.from(base64String, 'base64');
                    if (correctedOriginalBase64.startsWith('data:image/jpeg') || correctedOriginalBase64.startsWith('data:image/jpg')) {
                        embeddedPreviewImage = await pdfDoc.embedJpg(imageBytes);
                    } else if (correctedOriginalBase64.startsWith('data:image/png')) {
                        embeddedPreviewImage = await pdfDoc.embedPng(imageBytes);
                    } 
                    if(embeddedPreviewImage) console.log("Original image embedded.");
                    else console.log("Original image embedding failed.");
                } catch (imgError) { console.error("Error embedding corrected original image:", imgError); }
                try {
                    const base64String = boxedImageBase64.split(',')[1];
                    const imageBytes = Buffer.from(base64String, 'base64');
                     if (boxedImageBase64.startsWith('data:image/jpeg') || boxedImageBase64.startsWith('data:image/jpg')) {
                        embeddedBoxedImage = await pdfDoc.embedJpg(imageBytes);
                    } else if (boxedImageBase64.startsWith('data:image/png')) {
                        embeddedBoxedImage = await pdfDoc.embedPng(imageBytes);
                    } 
                     if(embeddedBoxedImage) console.log("Boxed image embedded.");
                    else console.log("Boxed image embedding failed.");
                } catch (imgError) { console.error("Error embedding boxed image:", imgError); }
                
                if (embeddedPreviewImage && embeddedBoxedImage) {
                    console.log("Both images embedded, drawing side-by-side...");
                     const spacing = 10;
                     const maxSingleImageWidth = (contentWidth - spacing) / 2; 
                     const maxImageHeight = height * 0.30; 
                     const prevOriginalDims = embeddedPreviewImage.scale(1);
                     const prevWidthScale = maxSingleImageWidth / prevOriginalDims.width;
                     const prevHeightScale = maxImageHeight / prevOriginalDims.height;
                     const prevFinalScale = Math.min(1, prevWidthScale, prevHeightScale);
                     const prevImageDims = embeddedPreviewImage.scale(prevFinalScale);
                     const boxedImageDims = embeddedBoxedImage.scale(prevFinalScale);
                     const drawHeight = Math.max(prevImageDims.height, boxedImageDims.height);
                     const imageY = y - drawHeight;
                     imageEndY = imageY;
                     if (imageY < margin + 50) { 
                         console.warn("Images position might be too low, skipping draw.");
                     } else {
                         const prevImageX = margin;
                         page.drawImage(embeddedPreviewImage, { x: prevImageX, y: imageY, width: prevImageDims.width, height: prevImageDims.height });
                         const boxedImageX = prevImageX + prevImageDims.width + spacing;
                         page.drawImage(embeddedBoxedImage, { x: boxedImageX, y: imageY, width: boxedImageDims.width, height: boxedImageDims.height });
                         const captionSize = 9;
                         const captionY = imageY - captionSize - 5;
                         const caption1 = 'Original Image';
                         const caption2 = 'Detected Face Box';
                         const caption1Width = font.widthOfTextAtSize(caption1, captionSize);
                         const caption2Width = font.widthOfTextAtSize(caption2, captionSize);
                         page.drawText(caption1, { x: prevImageX + (prevImageDims.width - caption1Width) / 2, y: captionY, size: captionSize, font: font, color: colors.lightGray });
                         page.drawText(caption2, { x: boxedImageX + (boxedImageDims.width - caption2Width) / 2, y: captionY, size: captionSize, font: font, color: colors.lightGray });
                         imageEndY = captionY;
                         console.log("Drew side-by-side images (orientation corrected) and captions.");
                     }
                } else {
                     console.log("One or both images failed to embed for side-by-side draw.");
                     y -= 10;
                }
            } else {
                console.log("Skipping image display: required base64 data missing.");
                y -= 10;
            }
        } else {
             console.log("Skipping image/frame display entirely.");
             y -= 10;
        }
        y = imageEndY - 25; // Space after image/frame section
        
        // 6. Analysis Explanation Section
        page.drawText('Analysis Explanation:', { x: margin, y: y, size: 11, font: boldFont, color: colors.darkGray });
        y -= 18;
        const explanationText = [
            "Our AI detection system analyzes patterns, artifacts, and inconsistencies that are typically present",
            "in AI-generated content. These may include unnatural textures, inconsistent lighting, unusual artifacts,",
            "or other anomalies that are characteristic of current AI image generation technologies."
        ];
        explanationText.forEach(line => {
            page.drawText(line, { x: margin, y: y, size: 9, font: font, color: colors.darkGray });
            y -= 12; // Line spacing
        });
        y -= 10; // Space after explanation
        
        // 7. Footer Disclaimer
        const footerY = margin / 2;
        const footerText1 = "© RealOrRender - This report is for informational purposes only.";
        const footerText2 = "Results may not be 100% accurate as AI detection technology continues to evolve.";
        const footerSize = 8;
        page.drawText(footerText1, { x: margin, y: footerY + footerSize + 2, size: footerSize, font: font, color: colors.lightGray });
        page.drawText(footerText2, { x: margin, y: footerY, size: footerSize, font: font, color: colors.lightGray });

        // --- End PDF Generation ---

        const pdfBytes = await pdfDoc.save();
        console.log(`--- PDF Generated (Size: ${pdfBytes.length} bytes) ---`);

        const filename = `RealOrRender-Analysis-${timestamp}.pdf`;
        console.log(`Setting download filename to: ${filename}`);

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`, 
            },
        });

    } catch (error) {
        console.error('--- Error in PDF Generation API ---', error);
        let errorMessage = 'Internal Server Error generating PDF.';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
} 