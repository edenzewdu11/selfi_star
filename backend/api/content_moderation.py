"""
Content Moderation Module
Uses NudeNet to detect NSFW/illegal content in images and videos.
Blocks uploads that contain sensitive or illegal material.
"""

import tempfile
import os
from PIL import Image
import io

# NSFW detection thresholds
NSFW_THRESHOLD = 0.6  # Only block clearly explicit content

# Labels that are ALWAYS blocked (explicit nudity) — one match = block
ALWAYS_BLOCK_LABELS = {
    "FEMALE_BREAST_EXPOSED",
    "FEMALE_GENITALIA_EXPOSED",
    "MALE_GENITALIA_EXPOSED",
    "BUTTOCKS_EXPOSED",
    "ANUS_EXPOSED",
    "KISSING",  # Add kissing detection
    "INTIMATE_TOUCH",
}

# Labels that indicate suggestive/sensitive content (lingerie, underwear, kissing, etc.)
# Blocked when 1 or more are detected
SUGGESTIVE_LABELS = {
    "FEMALE_BREAST_COVERED",
    "FEMALE_GENITALIA_COVERED",
    "MALE_GENITALIA_COVERED",
    "BUTTOCKS_COVERED",
    "BELLY_EXPOSED",
    "MALE_BREAST_EXPOSED",
    "LINGERIE",
    "UNDERWEAR",
    "BIKINI",
    "SWIMWEAR",
    "SEXUAL_TOUCH",
    "CLOSE_EMBRACE",
}

SUGGESTIVE_COMBO_THRESHOLD = 1  # Block if ANY suggestive label found

_detector = None

def detect_skin_ratio(pixels):
    """Detect the ratio of skin-colored pixels in an image."""
    try:
        # Simple skin detection based on RGB values
        # Skin typically has: R > 95, G > 40, B > 20, and R > G, R > B
        # And max(R,G,B) - min(R,G,B) > 15
        height, width, _ = pixels.shape
        total_pixels = height * width
        skin_pixels = 0
        
        for i in range(height):
            for j in range(width):
                r, g, b = pixels[i, j]
                if (r > 95 and g > 40 and b > 20 and 
                    r > g and r > b and 
                    max(r, g, b) - min(r, g, b) > 15):
                    skin_pixels += 1
        
        return skin_pixels / total_pixels if total_pixels > 0 else 0
    except Exception as e:
        print(f"[ContentModeration] Skin detection error: {e}")
        return 0

def detect_warm_tones(pixels):
    """Detect warm color tones common in intimate photos."""
    try:
        height, width, _ = pixels.shape
        total_pixels = height * width
        warm_pixels = 0
        
        for i in range(height):
            for j in range(width):
                r, g, b = pixels[i, j]
                # Warm tones: high red and green, lower blue
                if r > 100 and g > 80 and b < 100 and r > b:
                    warm_pixels += 1
        
        return warm_pixels / total_pixels if total_pixels > 0 else 0
    except Exception as e:
        print(f"[ContentModeration] Warm tone detection error: {e}")
        return 0

def detect_large_flesh_areas(pixels):
    """Detect large contiguous areas of flesh-colored pixels."""
    try:
        import numpy as np
        height, width, _ = pixels.shape
        skin_mask = np.zeros((height, width), dtype=bool)
        
        # Create skin mask
        for i in range(height):
            for j in range(width):
                r, g, b = pixels[i, j]
                if (r > 95 and g > 40 and b > 20 and 
                    r > g and r > b and 
                    max(r, g, b) - min(r, g, b) > 15):
                    skin_mask[i, j] = True
        
        # Find large connected components
        from scipy import ndimage
        labeled_array, num_features = ndimage.label(skin_mask)
        
        # Check if any skin area is larger than 20% of image
        for i in range(1, num_features + 1):
            area = np.sum(labeled_array == i)
            if area > (height * width * 0.2):  # More than 20% of image
                return True
        
        return False
    except ImportError:
        print("[ContentModeration] scipy not available for flesh area detection")
        return False
    except Exception as e:
        print(f"[ContentModeration] Flesh area detection error: {e}")
        return False

def _get_detector():
    """Lazy-load the NudeNet detector (downloads model on first use)."""
    global _detector
    if _detector is None:
        try:
            from nudenet import NudeDetector
            _detector = NudeDetector()
            print("[ContentModeration] NudeNet detector loaded successfully")
        except Exception as e:
            print(f"[ContentModeration] Failed to load NudeNet: {e}")
            _detector = False  # Mark as failed, not None
    return _detector if _detector is not False else None


def check_image_file(uploaded_file):
    """
    Check an uploaded image file for NSFW content.
    
    Args:
        uploaded_file: Django UploadedFile (InMemoryUploadedFile or TemporaryUploadedFile)
    
    Returns:
        (is_safe, message) - tuple of (bool, str)
    """
    detector = _get_detector()
    tmp_path = None
    try:
        # Save to a temp file for NudeNet
        suffix = os.path.splitext(uploaded_file.name)[1] or ".jpg"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp_path = tmp.name
            for chunk in uploaded_file.chunks():
                tmp.write(chunk)

        # Reset file pointer so Django can still save the file later
        uploaded_file.seek(0)

        # Try NudeNet detection if available
        if detector:
            try:
                detections = detector.detect(tmp_path)
                print(f"[ContentModeration] Image detections: {detections}")

                # Handle None or empty detections
                if not detections:
                    print(f"[ContentModeration] No detections from NudeNet")
                else:
                    # Ensure detections is a list
                    if not isinstance(detections, list):
                        print(f"[ContentModeration] Unexpected detection format: {type(detections)}")
                        detections = []
                    
                    # Strict: block explicit content OR any suggestive content
                    for det in detections:
                        if not isinstance(det, dict):
                            print(f"[ContentModeration] Invalid detection format: {det}")
                            continue
                            
                        label = det.get("class", "")
                        score = det.get("score", 0)
                        
                        print(f"[ContentModeration] Detection: {label} = {score:.2f} (threshold: {NSFW_THRESHOLD})")
                        
                        # Block explicit content
                        if score >= NSFW_THRESHOLD and label in ALWAYS_BLOCK_LABELS:
                            print(f"[ContentModeration] BLOCKED (explicit content) - {label} ({score:.2f})")
                            return False, (
                                "⚠️ This content contains inappropriate material and cannot be posted."
                            )
                        
                        # Block any suggestive content
                        if score >= NSFW_THRESHOLD and label in SUGGESTIVE_LABELS:
                            print(f"[ContentModeration] BLOCKED (suggestive content) - {label} ({score:.2f})")
                            return False, (
                                "⚠️ This content contains sensitive or suggestive material and cannot be posted. "
                                "Please follow our community guidelines."
                            )
            except Exception as e:
                print(f"[ContentModeration] NudeNet detection error: {e}")
                # Continue to fallback checks
        else:
            print("[ContentModeration] NudeNet detector not available, using fallback checks")
        
        # Fallback: Skip aggressive pixel-based checks since this is a selfie app.
        # Normal selfies contain skin, warm tones, and faces — these are NOT indicators of NSFW.
        # Only NudeNet-based detection above should block content.
        print("[ContentModeration] Skipping fallback pixel analysis (too many false positives for selfie app)")
        
        # Allow if no explicit or suggestive content detected
        print(f"[ContentModeration] Image PASSED all checks")
        return True, ""

    except Exception as e:
        print(f"[ContentModeration] Error checking image: {e}")
        import traceback
        traceback.print_exc()
        # If there's any error in moderation, allow the upload but log it
        # This prevents 500 errors from reaching the frontend
        return True, ""  # Allow on error to avoid blocking legitimate content
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


def check_video_file(uploaded_file):
    """
    Check an uploaded video file for NSFW content by extracting frames.
    
    Args:
        uploaded_file: Django UploadedFile
    
    Returns:
        (is_safe, message) - tuple of (bool, str)
    """
    detector = _get_detector()
    if detector is None:
        print("[ContentModeration] Detector unavailable, skipping video check")
        return True, ""

    tmp_path = None
    frame_paths = []
    try:
        import cv2

        # Save video to temp file
        suffix = os.path.splitext(uploaded_file.name)[1] or ".mp4"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp_path = tmp.name
            for chunk in uploaded_file.chunks():
                tmp.write(chunk)

        # Reset file pointer
        uploaded_file.seek(0)

        # Extract frames at intervals
        cap = cv2.VideoCapture(tmp_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30

        if total_frames <= 0:
            cap.release()
            return True, ""

        # Check up to 5 frames spread across the video
        num_checks = min(5, max(1, total_frames // int(fps)))
        frame_interval = max(1, total_frames // num_checks)

        for i in range(num_checks):
            frame_pos = i * frame_interval
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_pos)
            ret, frame = cap.read()
            if not ret:
                continue

            # Save frame as temp image
            frame_path = tempfile.mktemp(suffix=".jpg")
            cv2.imwrite(frame_path, frame)
            frame_paths.append(frame_path)

            detections = detector.detect(frame_path)
            print(f"[ContentModeration] Video frame {i} detections: {detections}")

            # Ultra-strict: block ANY NudeNet detection above threshold
            for det in detections:
                label = det.get("class", "")
                score = det.get("score", 0)
                if score >= NSFW_THRESHOLD:
                    print(f"[ContentModeration] BLOCKED video (any detection) - {label} ({score:.2f}) at frame {frame_pos}")
                    cap.release()
                    return False, (
                        "⚠️ This video contains sensitive/inappropriate material and CANNOT be posted. "
                        "Suggestive or sexually provocative content violates our community guidelines."
                    )

        cap.release()
        return True, ""

    except ImportError:
        print("[ContentModeration] OpenCV not available, skipping video check")
        return True, ""
    except Exception as e:
        print(f"[ContentModeration] Error checking video: {e}")
        return True, ""
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
        for fp in frame_paths:
            if os.path.exists(fp):
                os.unlink(fp)


def moderate_upload(uploaded_file):
    """
    Main entry point: moderate an uploaded file (image or video).
    
    Args:
        uploaded_file: Django UploadedFile
    
    Returns:
        (is_safe, message) - tuple of (bool, str)
    """
    if not uploaded_file:
        return True, ""

    content_type = getattr(uploaded_file, "content_type", "") or ""
    file_name = getattr(uploaded_file, "name", "") or ""

    is_image = content_type.startswith("image/") or file_name.lower().endswith(
        (".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp")
    )
    is_video = content_type.startswith("video/") or file_name.lower().endswith(
        (".mp4", ".webm", ".mov", ".avi", ".mkv")
    )

    if is_image:
        return check_image_file(uploaded_file)
    elif is_video:
        return check_video_file(uploaded_file)

    return True, ""
