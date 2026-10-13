"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Loader2, AlertCircle, QrCode } from "lucide-react";

export default function QRScanner({
  onScan,
}: {
  onScan: (text: string) => void;
}) {
  const [status, setStatus] = useState<"loading" | "active" | "error">(
    "loading"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = useRef(`qr-scanner-${Math.random().toString(36).slice(2)}`);
  const stoppedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const startScanner = async () => {
      try {
        console.log("[QRScanner] Starting...");

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error(
            "Your browser does not support camera access. Use Chrome or Safari."
          );
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((d) => d.kind === "videoinput");
        console.log("[QRScanner] Cameras found:", cameras.length);
        if (cameras.length === 0) {
          throw new Error("No camera detected on this device.");
        }

        const scanner = new Html5Qrcode(elementId.current, {
          verbose: false,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        });

        scannerRef.current = scanner;

        // Calculate a good qrbox size relative to viewport
        const viewportWidth = Math.min(window.innerWidth, 500);
        const boxSize = Math.floor(viewportWidth * 0.65);

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: boxSize, height: boxSize },
            aspectRatio: 1.0, // Square camera — makes centering reliable
          },
          (decodedText) => {
            if (stoppedRef.current) return;
            stoppedRef.current = true;
            console.log("[QRScanner] Decoded:", decodedText);

            scanner
              .stop()
              .then(() => scanner.clear())
              .catch(() => {})
              .finally(() => {
                if (!cancelled) onScan(decodedText);
              });
          },
          () => {
            // Silent frame errors
          }
        );

        console.log("[QRScanner] Started OK");
        if (!cancelled) setStatus("active");
      } catch (err: any) {
        if (cancelled) return;
        console.error("[QRScanner] Error:", err);

        let message = "Could not access camera.";
        const name = err?.name || "";
        const raw = err?.message || "";

        if (name === "NotAllowedError") {
          message =
            "Camera permission denied. Open site settings, allow camera, and reload.";
        } else if (name === "NotFoundError") {
          message = "No camera found on this device.";
        } else if (name === "NotReadableError") {
          message = "Camera is busy. Close other apps using it and try again.";
        } else if (raw) {
          message = raw;
        }

        setStatus("error");
        setErrorMsg(message);
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      if (scanner && !stoppedRef.current) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
      }
    };
  }, [onScan]);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Loading overlay */}
      {status === "loading" && (
        <div className="flex flex-col items-center justify-center py-16 text-white">
          <Loader2 className="animate-spin mb-3" size={32} />
          <p className="text-sm opacity-80">Starting camera...</p>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
            <AlertCircle className="text-red-400" size={32} />
          </div>
          <p className="text-white font-semibold mb-2">Camera unavailable</p>
          <p className="text-white/70 text-sm max-w-xs">{errorMsg}</p>
        </div>
      )}

      {/* Scanner container */}
      <div
        className="relative w-full overflow-hidden rounded-2xl bg-black"
        style={{
          aspectRatio: "1 / 1",
          maxHeight: "70vh",
          opacity: status === "active" ? 1 : 0.01,
          transition: "opacity 0.2s",
        }}
      >
        <div
          id={elementId.current}
          className="w-full h-full [&_video]:!w-full [&_video]:!h-full [&_video]:!object-cover [&_#qr-shaded-region]:!border-white/80"
        />

        {/* Custom center frame overlay — always centered */}
        {status === "active" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-[65%] aspect-square">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />

              {/* Scanning line animation */}
              <div
                className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent"
                style={{
                  animation: "scanline 2s ease-in-out infinite",
                }}
              />
            </div>
          </div>
        )}

        {/* Instructions */}
        {status === "active" && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
            <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
              <QrCode size={14} className="text-white/80" />
              <p className="text-white/90 text-xs font-medium">
                Align QR code within the frame
              </p>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes scanline {
          0% {
            top: 0%;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }

        /* Hide library's default UI — we use our own overlay */
        #${elementId.current} img[alt="Info icon"] {
          display: none !important;
        }
        #${elementId.current} button {
          display: none !important;
        }
      `}</style>
    </div>
  );
}