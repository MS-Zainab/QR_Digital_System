"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const QRScanner = dynamic(() => import("@/components/QRScanner"), {
  ssr: false,
});

export default function CameraTestPage() {
  const [result, setResult] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-black flex flex-col">
      <div className="p-4 text-white">
        <h1 className="text-xl font-bold">Camera Test</h1>
        <p className="text-sm opacity-70">Point at any QR code</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        {result ? (
          <div className="text-white text-center">
            <p className="text-sm opacity-70 mb-2">Decoded:</p>
            <p className="font-mono text-sm break-all bg-white/10 p-3 rounded">
              {result}
            </p>
            <button
              onClick={() => setResult(null)}
              className="mt-4 px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold"
            >
              Scan again
            </button>
          </div>
        ) : (
          <QRScanner onScan={(text) => setResult(text)} />
        )}
      </div>
    </main>
  );
}