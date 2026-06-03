"""
VietOCR sidecar (optional). Cài đặt một lần:

  pip install vietocr pillow flask werkzeug

Chạy:

  cd prototype/server
  python vietocr_service.py

Mặc định http://127.0.0.1:5001 — set VIETOCR_URL trong .env Node server.
"""

from __future__ import annotations

import io
import os

from flask import Flask, jsonify, request
from PIL import Image

app = Flask(__name__)

_predictor = None


def get_predictor():
    global _predictor
    if _predictor is None:
        from vietocr.tool.predictor import Predictor
        from vietocr.tool.config import Cfg

        config = Cfg.load_config_from_name("vgg_transformer")
        config["weights"] = os.environ.get(
            "VIETOCR_WEIGHTS",
            "https://vocr.vn/data/vietocr/vgg_transformer.pth",
        )
        config["cnn"]["pretrained"] = False
        config["device"] = "cpu"
        _predictor = Predictor(config)
    return _predictor


@app.get("/health")
def health():
    return jsonify({"ok": True, "engine": "vietocr"})


@app.post("/ocr")
def ocr():
    if "image" not in request.files:
        return jsonify({"error": "missing image"}), 400
    file = request.files["image"]
    img = Image.open(io.BytesIO(file.read())).convert("RGB")
    predictor = get_predictor()
    text = predictor.predict(img)
    return jsonify({"text": text})


if __name__ == "__main__":
    port = int(os.environ.get("VIETOCR_PORT", "5001"))
    print(f"VietOCR listening on http://127.0.0.1:{port}")
    app.run(host="127.0.0.1", port=port, debug=False)
