"""Unit and integration tests for Medical Image AI Prediction Engine.

Tests:
- Radiographic feature-based prediction (Cardiomegaly, Pneumonia, Pleural Effusion, Normal)
- Musculoskeletal cortical discontinuity / fracture detection
- Rejection of non-radiographic images (photos, white documents) to prevent false predictions
- Targeted Grad-CAM heatmap generation
- End-to-end inference flow
"""
import io
import os
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
import pytest

from services.medical_image_service import (
    validate_image_quality,
    normalize_scan_type,
    run_vision_inference,
    generate_gradcam_heatmap,
    _measure_cardiothoracic_ratio,
    _analyze_lung_fields,
    _analyze_bone_cortical_continuity,
)


def _create_synthetic_chest_xray(ctr_large=False, pneumonia=False, effusion=False) -> bytes:
    """Generate a realistic synthetic chest radiograph for deterministic testing."""
    size = (512, 512)
    # Dark background (unexposed beam corners)
    img = Image.new("L", size, color=10)
    draw = ImageDraw.Draw(img)

    # Thorax boundary (rib cage ellipse)
    draw.ellipse([30, 40, 482, 490], fill=40, outline=90, width=4)

    # Lung fields (dark radiolucent areas)
    # Right lung (viewer left)
    draw.ellipse([60, 80, 220, 420], fill=30)
    # Left lung (viewer right)
    draw.ellipse([292, 80, 452, 420], fill=30)

    # Spine / Mediastinum (bright central column)
    draw.rectangle([230, 40, 282, 490], fill=140)

    # Cardiac silhouette (heart)
    # Normal heart: width ~160 (CTR = 160 / 422 ~ 0.38)
    # Cardiomegaly heart: width ~260 (CTR = 260 / 422 ~ 0.61)
    if ctr_large:
        # Enlarged cardiac silhouette
        draw.ellipse([140, 260, 400, 440], fill=180)
    else:
        # Normal cardiac silhouette
        draw.ellipse([190, 270, 350, 420], fill=170)

    # Pneumonia: Dense focal airspace consolidation / opacification in right lower lobe
    if pneumonia:
        # Patchy dense white infiltrate in right lower zone
        draw.ellipse([90, 290, 190, 380], fill=190)

    # Pleural effusion: Blunted costophrenic angle at base
    if effusion:
        draw.polygon([(60, 370), (140, 370), (100, 430), (50, 420)], fill=185)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _create_synthetic_hand_xray(fracture=False) -> bytes:
    """Generate a synthetic hand / bone radiograph."""
    size = (512, 512)
    img = Image.new("L", size, color=15)
    draw = ImageDraw.Draw(img)

    # Soft tissue contour
    draw.polygon([(180, 100), (330, 100), (350, 480), (160, 480)], fill=45)

    # Long bone shaft (cortical high density)
    draw.rectangle([220, 120, 290, 460], fill=160, outline=230, width=4)

    if fracture:
        # Fracture line: sharp cortical discontinuity across the shaft
        draw.line([(218, 280), (292, 290)], fill=10, width=5)
        # Step-off displacement
        draw.rectangle([225, 292, 295, 340], fill=160, outline=240, width=3)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _create_non_radiographic_photo() -> bytes:
    """Generate a non-radiographic natural color photograph (pure white borders + high saturation color)."""
    size = (400, 400)
    # Bright white borders (document / webpage screenshot)
    img = Image.new("RGB", size, color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    # Flesh/peach natural photo in the center
    draw.ellipse([100, 100, 300, 300], fill=(235, 140, 110))
    draw.rectangle([120, 150, 280, 280], fill=(210, 100, 80))

    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


class TestMedicalImageQualityValidation:
    """Test scan quality and radiograph authenticity checks."""

    def test_empty_or_corrupted_image(self):
        res = validate_image_quality(b"", "scan.png")
        assert res["is_valid"] is False
        assert "empty or corrupted" in res["error"]

    def test_extremely_low_resolution(self):
        tiny_img = Image.new("L", (32, 32), color=100)
        buf = io.BytesIO()
        tiny_img.save(buf, format="PNG")
        res = validate_image_quality(buf.getvalue(), "tiny.png")
        assert res["is_valid"] is False
        assert "resolution" in res["error"].lower()

    def test_blank_solid_image(self):
        blank = Image.new("L", (200, 200), color=128)
        buf = io.BytesIO()
        blank.save(buf, format="PNG")
        res = validate_image_quality(buf.getvalue(), "blank.png")
        assert res["is_valid"] is False
        assert "Blank" in res["error"]

    def test_rejection_of_non_radiographic_photo(self):
        photo_bytes = _create_non_radiographic_photo()
        res = validate_image_quality(photo_bytes, "photo.jpg")
        assert res["is_radiograph"] is False
        assert "Non-radiographic" in res["error"]


class TestChestXRayPrediction:
    """Test radiographic computer vision predictions on chest X-rays."""

    def test_normal_chest_xray_prediction(self):
        img_bytes = _create_synthetic_chest_xray(ctr_large=False, pneumonia=False, effusion=False)
        # Even with generic filename, should predict Normal based on pixels
        res = run_vision_inference(img_bytes, "chest_xray", "patient_scan_001.png")
        assert res["success"] is True
        assert res["prediction"] == "Normal Chest Radiograph"
        assert res["confidence"] >= 0.90
        assert res["has_problem"] is False
        assert "CTR:" in res["details"] or "clear" in res["details"].lower()

    def test_cardiomegaly_prediction(self):
        img_bytes = _create_synthetic_chest_xray(ctr_large=True, pneumonia=False, effusion=False)
        # Even if filename doesn't mention cardiomegaly
        res = run_vision_inference(img_bytes, "chest_xray", "chest_scan.png")
        assert res["success"] is True
        assert res["prediction"] == "Cardiomegaly"
        assert res["has_problem"] is True
        assert res["confidence"] >= 0.80
        assert "CTR" in res["details"]
        assert res["activation_coords"] is not None

    def test_pneumonia_prediction(self):
        img_bytes = _create_synthetic_chest_xray(ctr_large=False, pneumonia=True, effusion=False)
        # Even if filename doesn't mention pneumonia
        res = run_vision_inference(img_bytes, "chest_xray", "scan_random_name.png")
        assert res["success"] is True
        assert res["prediction"] == "Pneumonia"
        assert res["has_problem"] is True
        assert "consolidation" in res["details"].lower() or "opacit" in res["details"].lower()
        assert res["activation_coords"] is not None

    def test_non_medical_photo_does_not_give_false_chest_prediction(self):
        photo_bytes = _create_non_radiographic_photo()
        res = run_vision_inference(photo_bytes, "chest_xray", "downloaded_image.jpg")
        assert res["success"] is False
        assert res["prediction"] == "Inconclusive / Non-Diagnostic Image"
        assert res["confidence"] == 0.0
        assert res["has_problem"] is False
        assert "Non-Diagnostic" in res["analysis_status"]


class TestMusculoskeletalXRayPrediction:
    """Test bone fracture vs normal bone cortex prediction."""

    def test_normal_hand_xray(self):
        img_bytes = _create_synthetic_hand_xray(fracture=False)
        res = run_vision_inference(img_bytes, "hand_xray", "hand_radiograph.png")
        assert res["success"] is True
        assert res["prediction"] == "Normal Structural Anatomy"
        assert res["has_problem"] is False

    def test_acute_fracture_detection(self):
        img_bytes = _create_synthetic_hand_xray(fracture=True)
        res = run_vision_inference(img_bytes, "hand_xray", "bone_scan.png")
        assert res["success"] is True
        assert res["prediction"] == "Acute Fracture / Bone Disruption"
        assert res["has_problem"] is True
        assert res["activation_coords"] is not None


class TestGradCAMHeatmapGeneration:
    """Test targeted Grad-CAM heatmap generation."""

    def test_targeted_heatmap_creation(self):
        img_bytes = _create_synthetic_chest_xray(ctr_large=True)
        res = run_vision_inference(img_bytes, "chest_xray", "test_xray.png")
        coords = res.get("activation_coords")

        heatmap_url = generate_gradcam_heatmap(img_bytes, "unit_test_img", coords, res.get("pathology_type"))
        assert heatmap_url == "/api/images/heatmap/unit_test_img"

        # Verify output file on disk
        heatmap_path = Path("uploads") / "heatmap_unit_test_img.png"
        assert heatmap_path.exists()
        assert heatmap_path.stat().st_size > 1000

        # Verify image dimensions
        with Image.open(heatmap_path) as h_img:
            assert h_img.size == (400, 400)
            assert h_img.mode == "RGB"
