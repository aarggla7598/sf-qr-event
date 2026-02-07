import { LightningElement, api } from "lwc";
import { loadScript } from "lightning/platformResourceLoader";
import jsQR from "@salesforce/resourceUrl/jsQR";

export default class QrCameraScanner extends LightningElement {
  @api active = false;

  errorMessage = "";
  isScanning = false;
  isInitializing = false;

  _stream = null;
  _animationFrameId = null;
  _jsQRLoaded = false;
  _lastScanTime = 0;
  _debounceMs = 1500;
  _cameraStarted = false;

  get isCameraActive() {
    return this._cameraStarted && !this.errorMessage;
  }

  get showSpinner() {
    return this.isInitializing && !this._cameraStarted;
  }

  async renderedCallback() {
    if (this.active && !this._jsQRLoaded) {
      try {
        await loadScript(this, jsQR);
        this._jsQRLoaded = true;
        this._startCamera();
      } catch {
        this.errorMessage = "Failed to load QR scanner library.";
      }
    } else if (this.active && this._jsQRLoaded && !this._stream) {
      this._startCamera();
    }
  }

  disconnectedCallback() {
    this._stopCamera();
  }

  async _startCamera() {
    if (this._stream) return;
    this.errorMessage = "";
    this.isInitializing = true;
    this._cameraStarted = true;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.isInitializing = false;
      this._cameraStarted = false;
      this.errorMessage = "Camera is not supported in this browser.";
      return;
    }

    try {
      this._stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } }
      });
      // Wait a tick for the template to render the video element
      // eslint-disable-next-line @lwc/lwc/no-async-operation
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const video = this.refs.video;
      if (video) {
        video.srcObject = this._stream;
        video.onloadedmetadata = () => {
          this.isInitializing = false;
          this.isScanning = true;
          // eslint-disable-next-line @lwc/lwc/no-async-operation
          requestAnimationFrame(() => {
            this._scanFrame();
          });
        };
      }
    } catch (error) {
      this.isInitializing = false;
      this._cameraStarted = false;
      if (error.name === "NotAllowedError") {
        this.errorMessage =
          "Camera permission denied. Please allow camera access and try again.";
      } else if (error.name === "NotFoundError") {
        this.errorMessage = "No camera found on this device.";
      } else {
        this.errorMessage = "Failed to start camera: " + error.message;
      }
    }
  }

  _scanFrame() {
    if (!this.active || !this._stream) return;

    const video = this.refs.video;
    const canvas = this.refs.canvas;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      // eslint-disable-next-line @lwc/lwc/no-async-operation
      this._animationFrameId = requestAnimationFrame(() => this._scanFrame());
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // jsQR is loaded as a global via loadScript
    const code = window.jsQR(
      imageData.data,
      imageData.width,
      imageData.height,
      {
        inversionAttempts: "dontInvert"
      }
    );

    if (code && code.data) {
      const now = Date.now();
      if (now - this._lastScanTime > this._debounceMs) {
        this._lastScanTime = now;
        this.dispatchEvent(new CustomEvent("scan", { detail: code.data }));
      }
    }

    // eslint-disable-next-line @lwc/lwc/no-async-operation
    this._animationFrameId = requestAnimationFrame(() => this._scanFrame());
  }

  _stopCamera() {
    if (this._animationFrameId) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }
    if (this._stream) {
      this._stream.getTracks().forEach((track) => track.stop());
      this._stream = null;
    }
    this.isScanning = false;
    this.isInitializing = false;
    this._cameraStarted = false;
  }
}
