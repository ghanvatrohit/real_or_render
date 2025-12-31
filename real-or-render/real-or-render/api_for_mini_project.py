import sys
import tensorflow as tf
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from sklearn.base import BaseEstimator, ClassifierMixin
import pickle
from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np
import tempfile
import cv2
from PIL import Image, ImageOps
import logging
from typing import Tuple, Optional, Dict, Any
import os
import io
import base64

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Model Paths ---
script_dir = os.path.dirname(os.path.abspath(__file__))

# Classification Model
pkl_model_path = os.path.join(script_dir, 'project512.pkl')

# Face Detection Model (Using YuNet ONNX)
YUNET_MODEL_PATH = os.path.join(script_dir, "face_detection_yunet_2023mar.onnx")
FACE_CONFIDENCE_THRESHOLD = 0.4 # YuNet - Lowered threshold to potentially find smaller faces

# --- Load Models ---

# Load Face Detection Model (YuNet)
try:
    if not os.path.exists(YUNET_MODEL_PATH):
         raise FileNotFoundError(f"YuNet model not found at: {YUNET_MODEL_PATH}")
    face_net = cv2.FaceDetectorYN.create(
        model=YUNET_MODEL_PATH,
        config="", # Not needed for ONNX usually
        input_size=(320, 320), # Default input size hint for YuNet, can be adjusted
        score_threshold=FACE_CONFIDENCE_THRESHOLD,
        nms_threshold=0.3, # Non-Max Suppression threshold
        top_k=5000 # Max number of faces to detect
    )
    logger.info(f"Loaded YuNet face detection model from: {YUNET_MODEL_PATH}")
except Exception as e:
    logger.error(f"!!! Error loading YuNet face detection model: {e}")
    logger.error(f"!!! Please ensure '{os.path.basename(YUNET_MODEL_PATH)}' is present in the script directory.")
    face_net = None

# Load Classification Model
sys.modules['models'] = sys.modules['__main__']

class DeepFakeClassifier(BaseEstimator, ClassifierMixin):
    def __init__(self, model_path=None, model=None):
        if model is not None:
            self.model = model
        elif model_path is not None:
            self.model = tf.keras.models.load_model(model_path)
        else:
            raise ValueError("Either model or model_path must be provided")

    def predict_proba(self, X):
        return self.model.predict(X)

    def predict(self, X):
        return self.model.predict(X)

class CustomUnpickler(pickle.Unpickler):
    def find_class(self, module, name):
        if name == "DeepFakeClassifier":
            return DeepFakeClassifier
        return super().find_class(module, name)

logger.info(f"Loading classification model from: {pkl_model_path}")
try:
    with open(pkl_model_path, 'rb') as f:
        loaded_model = CustomUnpickler(f).load()
    logger.info("Classification model loaded.")
except FileNotFoundError:
     logger.error(f"!!! Classification model file not found: {pkl_model_path}")
     # Exit or handle appropriately if classification is essential
     sys.exit(1)
except Exception as e:
     logger.error(f"!!! Error loading classification model: {e}")
     sys.exit(1)


# --- FastAPI App Setup ---
app = FastAPI()

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Image Processing Function ---
def process_image(file_obj) -> Optional[Tuple[float, float, Tuple[int, int, int, int], str, str]]:
    """Processes an image file, detects all faces using YuNet, predicts for each, averages results, and returns."""
    if face_net is None:
        raise RuntimeError("Face detection model failed to load. Cannot process image.")

    try:
        pil_image = Image.open(file_obj).convert("RGB")
        logger.info("Applying EXIF transpose...")
        pil_image_corrected = ImageOps.exif_transpose(pil_image)
        logger.info("EXIF transpose applied.")

        original_frame = np.array(pil_image_corrected)
        original_frame = original_frame[:, :, ::-1].copy()
        frame_for_detection = original_frame.copy()

        (h, w) = frame_for_detection.shape[:2]
        if h == 0 or w == 0:
            logger.warning("Warning: Invalid image dimensions received.")
            return None

        # --- YuNet Face Detection ---
        face_net.setInputSize((w, h))
        logger.info("Running YuNet face detection...")
        results = face_net.detect(frame_for_detection)
        faces = results[1]
        logger.info(f"YuNet detected {len(faces) if faces is not None else 0} faces initially.")

        all_prediction_scores = []
        all_face_confidences = []
        all_boxes = [] # Store all boxes (startX, startY, endX, endY)
        highest_confidence = 0.0
        box_of_highest_confidence_face = None

        if faces is not None:
            for face in faces:
                box = face[0:4].astype(np.int32)
                confidence = float(face[14])

                # Clamp box coordinates
                x, y, w_box, h_box = box
                startX = max(0, x)
                startY = max(0, y)
                endX = min(w - 1, x + w_box)
                endY = min(h - 1, y + h_box)
                w_box = endX - startX
                h_box = endY - startY

                if w_box > 0 and h_box > 0:
                    face_roi = frame_for_detection[startY:endY, startX:endX]
                    if face_roi.shape[0] > 0 and face_roi.shape[1] > 0:
                        current_box = (startX, startY, endX, endY)
                        all_boxes.append(current_box)
                        all_face_confidences.append(confidence)

                        # Keep track of the box for the highest confidence face for API return consistency
                        if confidence > highest_confidence:
                            highest_confidence = confidence
                            box_of_highest_confidence_face = current_box

                        # --- Prepare and Predict for *this* face ---
                        try:
                            face_rgb = cv2.cvtColor(face_roi, cv2.COLOR_BGR2RGB)
                            face_rgb_resized = cv2.resize(face_rgb, (256, 256))
                            image_array = img_to_array(face_rgb_resized)
                            image_array = np.expand_dims(image_array, axis=0)
                            image_array /= 255.0
                            prediction_score = loaded_model.predict(image_array)[0][0]
                            all_prediction_scores.append(prediction_score)
                            logger.debug(f"Processed face at {current_box} - Confidence: {confidence:.4f}, Pred Score: {prediction_score:.4f}")
                        except Exception as pred_err:
                            logger.warning(f"Could not process/predict face ROI at {current_box}: {pred_err}")

        # Check if any faces were successfully processed
        if not all_prediction_scores:
            logger.warning("Warning: No faces were successfully processed for prediction.")
            return None

        # Calculate average prediction score and average face confidence
        avg_prediction_score = float(np.mean(all_prediction_scores))
        avg_face_confidence = float(np.mean(all_face_confidences))
        logger.info(f"Processed {len(all_prediction_scores)} faces. Avg Pred Score: {avg_prediction_score:.4f}, Avg Face Conf: {avg_face_confidence:.4f}")

        # --- Encode Corrected Original Image (RGB) using PIL ---
        corrected_original_data_url = None
        try:
            original_frame_rgb = cv2.cvtColor(original_frame, cv2.COLOR_BGR2RGB)
            pil_original_corrected = Image.fromarray(original_frame_rgb)
            buffer_orig = io.BytesIO()
            pil_original_corrected.save(buffer_orig, format="JPEG")
            buffer_orig.seek(0)
            orig_bytes = buffer_orig.read()
            orig_base64 = base64.b64encode(orig_bytes).decode('utf-8')
            corrected_original_data_url = f"data:image/jpeg;base64,{orig_base64}"
            logger.info(f"Encoded corrected original image to base64 JPEG.")
        except Exception as pil_orig_error:
            logger.error(f"Failed to encode corrected original image: {pil_orig_error}", exc_info=True)
            return None

        # --- Create and Encode Boxed Image (with ALL detected boxes) --- 
        boxed_image_data_url = None
        try:
            boxed_frame = original_frame.copy()
            # Draw all detected boxes
            for box_coords in all_boxes:
                (startX, startY, endX, endY) = box_coords
                cv2.rectangle(boxed_frame, (startX, startY), (endX, endY), (0, 255, 0), 2)

            boxed_frame_rgb = cv2.cvtColor(boxed_frame, cv2.COLOR_BGR2RGB)
            pil_boxed_image = Image.fromarray(boxed_frame_rgb)
            buffer_boxed = io.BytesIO()
            pil_boxed_image.save(buffer_boxed, format="JPEG")
            buffer_boxed.seek(0)
            boxed_bytes = buffer_boxed.read()
            boxed_image_base64 = base64.b64encode(boxed_bytes).decode('utf-8')
            boxed_image_data_url = f"data:image/jpeg;base64,{boxed_image_base64}"
            logger.info(f"Encoded boxed image with {len(all_boxes)} boxes to base64 JPEG.")
        except Exception as pil_boxed_error:
             logger.error(f"Failed to encode boxed image: {pil_boxed_error}", exc_info=True)
             return None

        # Return avg prediction, avg face confidence, box of highest confidence face, corrected original base64, boxed (all faces) base64
        if box_of_highest_confidence_face is None:
             # Fallback if somehow no boxes were recorded but predictions were made
             box_of_highest_confidence_face = (0, 0, 0, 0)
        return avg_prediction_score, avg_face_confidence, box_of_highest_confidence_face, corrected_original_data_url, boxed_image_data_url

    except Exception as e:
        logger.error(f"Error in process_image: {e}", exc_info=True)
        return None

# --- Video Processing Function ---
def process_video(video_path: str) -> Optional[Dict[str, Any]]:
    """Processes a video file, detects all faces/frame, predicts for each, averages results."""
    if face_net is None:
        raise RuntimeError("Face detection model failed to load. Cannot process video.")

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        logger.error(f"Error opening video file: {video_path}")
        return None

    # Store per-frame averages
    frame_avg_predictions = []
    frame_avg_face_confidences = []
    processed_frame_count = 0
    frame_skip = 5

    first_raw_frame = None
    first_frame_all_boxes = None # Store list of boxes for the first frame

    try:
        while True:
            frame_id = int(cap.get(cv2.CAP_PROP_POS_FRAMES))
            ret, frame = cap.read()
            if not ret:
                break
            if frame_id % frame_skip != 0:
                continue

            (h, w) = frame.shape[:2]
            if h == 0 or w == 0:
                logger.warning(f"Frame {frame_id}: Invalid dimensions, skipping.")
                continue

            # --- YuNet Face Detection for the frame ---
            face_net.setInputSize((w, h))
            results = face_net.detect(frame)
            faces = results[1]

            # Store results for *this frame*
            predictions_this_frame = []
            confidences_this_frame = []
            boxes_this_frame = [] # (startX, startY, endX, endY)

            if faces is not None:
                for face in faces:
                    box = face[0:4].astype(np.int32)
                    confidence = float(face[14])

                    x, y, w_box, h_box = box
                    startX = max(0, x)
                    startY = max(0, y)
                    endX = min(w - 1, x + w_box)
                    endY = min(h - 1, y + h_box)
                    w_box = endX - startX
                    h_box = endY - startY

                    if w_box > 0 and h_box > 0:
                        face_roi = frame[startY:endY, startX:endX]
                        if face_roi.shape[0] > 0 and face_roi.shape[1] > 0:
                            current_box = (startX, startY, endX, endY)
                            boxes_this_frame.append(current_box)
                            confidences_this_frame.append(confidence)

                            # --- Prepare and Predict for *this* face ---
                            try:
                                face_rgb = cv2.cvtColor(face_roi, cv2.COLOR_BGR2RGB)
                                face_rgb_resized = cv2.resize(face_rgb, (256, 256))
                                image_array = img_to_array(face_rgb_resized)
                                image_array = np.expand_dims(image_array, axis=0)
                                image_array /= 255.0
                                prediction = loaded_model.predict(image_array)[0][0]
                                predictions_this_frame.append(prediction)
                            except Exception as pred_err:
                                logger.warning(f"Frame {frame_id}: Could not process/predict face ROI at {current_box}: {pred_err}")

            # If any faces were processed in this frame, calculate averages for the frame
            if predictions_this_frame:
                avg_pred_for_frame = float(np.mean(predictions_this_frame))
                avg_conf_for_frame = float(np.mean(confidences_this_frame))
                frame_avg_predictions.append(avg_pred_for_frame)
                frame_avg_face_confidences.append(avg_conf_for_frame)
                processed_frame_count += 1

                # Store the first raw frame and *all* its boxes if not already stored
                if first_raw_frame is None:
                    first_raw_frame = frame.copy()
                    first_frame_all_boxes = boxes_this_frame # Store the list of boxes
                    logger.info(f"Stored first frame (ID: {frame_id}) with {len(boxes_this_frame)} detected faces.")

    finally:
        cap.release()

    # Check if any frames were processed at all
    if processed_frame_count == 0:
        logger.warning("Warning: No faces were successfully processed in any video frame.")
        return None

    # Calculate overall averages from per-frame averages
    overall_avg_pred = float(np.mean(frame_avg_predictions))
    overall_avg_face_confidence = float(np.mean(frame_avg_face_confidences))
    logger.info(f"Processed {processed_frame_count} frames. Overall Avg Pred: {overall_avg_pred:.4f}, Overall Avg Face Conf: {overall_avg_face_confidence:.4f}")

    # --- Encode First Frame (Raw and Boxed with ALL boxes) ---
    first_raw_frame_data_url = None
    first_boxed_frame_data_url = None

    if first_raw_frame is not None and first_frame_all_boxes is not None:
        # 1. Encode Raw First Frame
        try:
            first_frame_rgb = cv2.cvtColor(first_raw_frame, cv2.COLOR_BGR2RGB)
            pil_first_frame_raw = Image.fromarray(first_frame_rgb)
            buffer_raw = io.BytesIO()
            pil_first_frame_raw.save(buffer_raw, format="JPEG")
            buffer_raw.seek(0)
            raw_bytes = buffer_raw.read()
            raw_base64 = base64.b64encode(raw_bytes).decode('utf-8')
            first_raw_frame_data_url = f"data:image/jpeg;base64,{raw_base64}"
            logger.info("Encoded first raw frame.")
        except Exception as raw_encode_error:
            logger.error(f"Failed to encode first raw frame: {raw_encode_error}", exc_info=True)

        # 2. Encode Boxed First Frame (drawing all detected boxes for that frame)
        try:
            first_frame_copy = first_raw_frame.copy()
            # Draw all boxes detected in that first frame
            for box_coords in first_frame_all_boxes:
                (startX, startY, endX, endY) = box_coords
                cv2.rectangle(first_frame_copy, (startX, startY), (endX, endY), (0, 255, 0), 2)

            first_frame_boxed_rgb = cv2.cvtColor(first_frame_copy, cv2.COLOR_BGR2RGB)
            pil_first_frame_boxed = Image.fromarray(first_frame_boxed_rgb)
            buffer_boxed = io.BytesIO()
            pil_first_frame_boxed.save(buffer_boxed, format="JPEG")
            buffer_boxed.seek(0)
            boxed_bytes = buffer_boxed.read()
            boxed_base64 = base64.b64encode(boxed_bytes).decode('utf-8')
            first_boxed_frame_data_url = f"data:image/jpeg;base64,{boxed_base64}"
            logger.info(f"Encoded first boxed frame with {len(first_frame_all_boxes)} boxes.")
        except Exception as frame_encode_error:
            logger.error(f"Failed to encode first boxed frame: {frame_encode_error}", exc_info=True)

    return {
        "average_prediction": overall_avg_pred,
        "average_face_confidence": overall_avg_face_confidence,
        "processed_frame_count": processed_frame_count,
        "first_raw_frame_base64": first_raw_frame_data_url,
        "first_boxed_frame_base64": first_boxed_frame_data_url
    }


# --- API Endpoints ---

@app.post("/predict_image")
async def predict_image_restored(request: Request):
    # ... (Endpoint logic remains largely the same, uses the updated process_image)
    try:
        form_data = await request.form()
        if 'file' not in form_data:
            raise HTTPException(status_code=400, detail="'file' field missing in form data.")
        file_field = form_data['file']
        # Basic check if it looks like an UploadFile
        is_likely_uploadfile = (
            hasattr(file_field, 'filename') and
            hasattr(file_field, 'content_type') and
            hasattr(file_field, 'file') and
            callable(getattr(file_field, 'read', None))
        )
        if not is_likely_uploadfile:
            actual_value = str(file_field)[:200]
            logger.error(f"!!! ERROR: 'file' field doesn't act like UploadFile. Type: {type(file_field)}, Value: {actual_value}")
            raise HTTPException(status_code=400, detail=f"Expected 'file' field to be a file upload, received {type(file_field)}.")

        # Call the updated process_image which now averages predictions
        processing_result = process_image(file_field.file)

        if processing_result is None:
             logger.warning("predict_image endpoint: process_image returned None.")
             raise HTTPException(status_code=400, detail="Image processing failed or no faces processed.")

        # Unpack the result tuple (order matches updated process_image return)
        # Note: face_box is still the box of the highest confidence face for API consistency
        avg_prediction_score, avg_face_confidence, highest_conf_face_box, corrected_original_base64, boxed_image_base64 = processing_result

        # Label based on the *average* prediction score
        label = "real" if avg_prediction_score > 0.5 else "fake"

        return {
            "prediction": avg_prediction_score, # Return the average score
            "label": label,
            "face_confidence": float(avg_face_confidence), # Return average face confidence
            "face_box": [int(x) for x in highest_conf_face_box], # Return box of highest conf face
            "corrected_original_base64": corrected_original_base64,
            "boxed_image_base64": boxed_image_base64 # Image has all boxes drawn
        }

    except HTTPException as http_exc:
        raise http_exc
    except RuntimeError as rt_err:
         logger.error(f"Runtime error in predict_image: {rt_err}", exc_info=True)
         raise HTTPException(status_code=500, detail=str(rt_err))
    except Exception as e:
        logger.error(f"Unexpected error processing image endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/predict_video")
async def predict_video_restored(request: Request):
    # ... (Endpoint logic remains largely the same, uses the updated process_video)
    tmp_path = None
    try:
        form_data = await request.form()
        if 'file' not in form_data:
            raise HTTPException(status_code=400, detail="'file' field missing in form data.")
        file_field = form_data['file']
        # Basic check if it looks like an UploadFile
        is_likely_uploadfile = (
            hasattr(file_field, 'filename') and
            hasattr(file_field, 'content_type') and
            hasattr(file_field, 'file') and
            callable(getattr(file_field, 'read', None))
        )
        if not is_likely_uploadfile:
            actual_value = str(file_field)[:200]
            logger.error(f"!!! ERROR: 'file' field doesn't act like UploadFile. Type: {type(file_field)}, Value: {actual_value}")
            raise HTTPException(status_code=400, detail=f"Expected 'file' field to be a file upload, received {type(file_field)}.")

        # Save to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp: # Use appropriate suffix if known
            content = await file_field.read()
            if not content:
                 raise HTTPException(status_code=400, detail="Received empty file.")
            tmp.write(content)
            tmp_path = tmp.name
        logger.info(f"Video saved to temporary file: {tmp_path}")

        # Call the updated process_video which now averages predictions
        video_results = process_video(tmp_path)

        # Clean up temp file immediately after processing
        if tmp_path and os.path.exists(tmp_path):
             try:
                 os.unlink(tmp_path)
                 logger.info(f"Removed temporary file: {tmp_path}")
             except OSError as unlink_error:
                 logger.warning(f"Could not remove temporary file {tmp_path}: {unlink_error}")
             tmp_path = None # Reset path after deletion

        if video_results is None:
             logger.warning("predict_video endpoint: process_video returned None.")
             raise HTTPException(status_code=400, detail="Video processing failed or no faces processed.")

        # Determine label based on the overall average prediction score
        label = "real" if video_results["average_prediction"] > 0.5 else "fake"
        video_results["label"] = label

        # Return the results dictionary from process_video 
        # (already contains overall averages and first frame with all boxes drawn)
        return video_results

    except HTTPException as http_exc:
        # Clean up temp file if an HTTP error occurred mid-processing
        if tmp_path and os.path.exists(tmp_path):
             try: os.unlink(tmp_path); logger.info(f"Cleaned up temp file on HTTP error: {tmp_path}")
             except OSError: pass
        raise http_exc
    except RuntimeError as rt_err:
         logger.error(f"Runtime error in predict_video: {rt_err}", exc_info=True)
         # Clean up temp file
         if tmp_path and os.path.exists(tmp_path):
              try: os.unlink(tmp_path); logger.info(f"Cleaned up temp file on runtime error: {tmp_path}")
              except OSError: pass
         raise HTTPException(status_code=500, detail=str(rt_err))
    except Exception as e:
        logger.error(f"Unexpected error processing video endpoint: {e}", exc_info=True)
        # Clean up temp file if it exists due to unexpected error
        if tmp_path and os.path.exists(tmp_path):
             try:
                 os.unlink(tmp_path)
                 logger.info(f"Cleaned up temp file on unexpected error: {tmp_path}")
             except OSError as unlink_error:
                 logger.warning(f"Could not remove temporary file {tmp_path} on error: {unlink_error}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# --- Main Execution ---
if __name__ == '__main__':
    # Check if face detector loaded correctly before starting server
    if face_net is None:
        logger.error("!!! Face detection model failed to load. FastAPI server cannot start.")
    else:
        logger.info("Starting FastAPI server on 0.0.0.0:8000")
        uvicorn.run(app, host="0.0.0.0", port=8000)