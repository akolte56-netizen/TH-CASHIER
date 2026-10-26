import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, Check, X, Upload, AlertCircle } from 'lucide-react';
import { PhotoEvidence } from '../types';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photo: PhotoEvidence) => void;
  taskTitle: string;
  employeeId: string;
  employeeName: string;
  reportId?: string;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  taskTitle,
  employeeId,
  employeeName,
  reportId,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [photoSource, setPhotoSource] = useState<'live_camera' | 'device_upload'>('live_camera');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera tracks helper (ref-based so this callback never changes)
  const streamRef = useRef<MediaStream | null>(null);
  const startReqRef = useRef(0);
  const stopCamera = useCallback(() => {
    startReqRef.current += 1;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setStream(null);
  }, []);

  // Start camera stream
  const startCamera = useCallback(async () => {
    setIsInitializing(true);
    setCameraError(null);
    stopCamera();
    const reqId = ++startReqRef.current;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser or context.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (reqId !== startReqRef.current) {
        mediaStream.getTracks().forEach(track => track.stop());
        return;
      }
      streamRef.current = mediaStream;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {});
      }
      setPhotoSource('live_camera');
    } catch (err: any) {
      console.warn('Camera access error:', err);
      let errorMsg = 'Unable to access camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Camera permission denied. Please allow camera access in browser settings or upload from device.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No camera device found on this system. You can upload an image from your device.';
      } else {
        errorMsg = err.message || 'Camera could not be started.';
      }
      setCameraError(errorMsg);
    } finally {
      setIsInitializing(false);
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, capturedImage, startCamera, stopCamera]);

  // Re-attach the live stream whenever the <video> element is (re)mounted
  useEffect(() => {
    const video = videoRef.current;
    if (video && stream && video.srcObject !== stream) {
      video.srcObject = stream;
      video.play().catch(() => {});
    }
  }, [stream, capturedImage, cameraError]);

  // Flip camera (front/back)
  const toggleFacingMode = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Watermark stamper on canvas
  const drawWatermarkAndStamp = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    timestampStr: string
  ) => {
    // Semi-transparent black gradient bar at bottom
    const barHeight = Math.max(54, height * 0.12);
    ctx.fillStyle = 'rgba(10, 10, 12, 0.82)';
    ctx.fillRect(0, height - barHeight, width, barHeight);

    // Subtle top border on the bar
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, height - barHeight, width, 2);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`th CASHIER EVIDENCE · ${employeeName} (${employeeId})`, 14, height - barHeight + 20);

    ctx.fillStyle = '#d4d4d8';
    ctx.font = '11px "JetBrains Mono", monospace';
    const subText = `${timestampStr} · ${reportId ? reportId + ' · ' : ''}${taskTitle.slice(0, 38)}`;
    ctx.fillText(subText, 14, height - barHeight + 40);
  };

  // Take photo from video stream
  const handleCaptureFromVideo = () => {
    if (!videoRef.current || !canvasRef.current) return;
    if (!videoRef.current.videoWidth) return; // camera not ready yet

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Add professional operational watermark stamp
    const now = new Date();
    const formattedTimestamp = now.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    drawWatermarkAndStamp(ctx, canvas.width, canvas.height, formattedTimestamp);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    setPhotoSource('live_camera');
    stopCamera();
  };

  // Handle local file upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const img = new Image();
      img.onload = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        canvas.width = img.width > 1280 ? 1280 : img.width;
        canvas.height = (img.height * canvas.width) / img.width;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const now = new Date();
        const formattedTimestamp = now.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        drawWatermarkAndStamp(ctx, canvas.width, canvas.height, formattedTimestamp + ' (Device Upload)');

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImage(dataUrl);
        setPhotoSource('device_upload');
        stopCamera();
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleConfirm = () => {
    if (!capturedImage) return;

    const evidence: PhotoEvidence = {
      id: 'photo_' + Date.now(),
      dataUrl: capturedImage,
      capturedAt: new Date().toISOString(),
      capturedByEmployeeId: employeeId,
      capturedByName: employeeName,
      source: photoSource,
      notes: `Captured for: ${taskTitle}`,
    };

    onCapture(evidence);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-4 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h3 className="text-sm font-semibold text-neutral-100 truncate">Capture Operational Proof</h3>
              <p className="text-xs text-neutral-400 truncate">{taskTitle}</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors shrink-0"
            aria-label="Close camera"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport / Preview Area */}
        <div className="relative bg-black flex-1 min-h-[300px] flex items-center justify-center overflow-hidden">
          {/* Hidden Canvas for manipulation and watermarking */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Captured Preview Mode */}
          {capturedImage ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img
                src={capturedImage}
                alt="Captured Proof"
                className="max-h-[60vh] w-auto object-contain"
              />
              <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-mono text-amber-300 border border-neutral-700">
                {photoSource === 'live_camera' ? 'Live Camera Capture' : 'Device Upload'}
              </div>
            </div>
          ) : (
            /* Live Camera Stream Mode */
            <div className="relative w-full h-full min-h-[320px] flex items-center justify-center">
              {cameraError ? (
                <div className="p-6 text-center max-w-sm">
                  <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-neutral-200 mb-1">Camera Notice</h4>
                  <p className="text-xs text-neutral-400 mb-4">{cameraError}</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors border border-neutral-700"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Select Image From Device
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted
                    className="w-full h-full object-cover min-h-[320px]"
                  />
                  {/* Camera overlay guide */}
                  <div className="absolute inset-4 pointer-events-none border border-white/20 rounded-xl flex flex-col justify-between p-3">
                    <div className="flex justify-between items-center text-[10px] font-mono text-white/70 bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm self-start">
                      <span>REC · LIVE FEED</span>
                    </div>
                    <div className="text-center text-[11px] text-white/80 bg-black/50 py-1 px-3 rounded-md backdrop-blur-sm self-center">
                      Align item or workstation inside the frame
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between gap-3">
          {capturedImage ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors border border-neutral-700"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retake Photo
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shadow-lg shadow-amber-400/10"
              >
                <Check className="w-4 h-4" />
                Attach Evidence
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-xl text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition-colors"
                  title="Upload from device"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="p-2.5 rounded-xl text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition-colors"
                  title="Switch camera"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Shutter Button */}
              <button
                type="button"
                disabled={isInitializing || !!cameraError}
                onClick={handleCaptureFromVideo}
                className="w-14 h-14 rounded-full border-4 border-amber-400 p-1 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-40 disabled:hover:scale-100"
                aria-label="Take photo"
              >
                <div className="w-full h-full rounded-full bg-amber-400 hover:bg-amber-300 transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="px-3.5 py-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </>
          )}

          {/* Hidden File Input for fallback */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};
