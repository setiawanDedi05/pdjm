'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, Loader2 } from 'lucide-react';

interface QrScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
}

export default function QrScanner({ onScan, onError }: QrScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isPaused, setIsPaused] = useState(false); // State untuk visual loading
  const [hasCamera, setHasCamera] = useState(true);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isCooldownRef = useRef(false); // Ref untuk memblokir scan beruntun
  const containerId = 'qr-reader';

  // Durasi delay (bisa diatur sesuai kebutuhan)
  const SCAN_DELAY = 2000; // 5 detik

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  async function startScanning() {
    setIsScanning(true);
    setIsPaused(false);

    setTimeout(async () => {
      try {
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode(containerId);
        }

        await scannerRef.current.start(
          { facingMode: 'environment' },
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0 
          },
          (decodedText) => {
            // Cek apakah sedang dalam masa cooldown
            if (isCooldownRef.current) return;

            // Jalankan fungsi onScan
            handleSuccess(decodedText);
          },
          undefined
        );
      } catch (err) {
        setHasCamera(false);
        setIsScanning(false);
        onError?.(err instanceof Error ? err.message : 'Kamera tidak tersedia');
      }
    }, 150);
  }

  function handleSuccess(decodedText: string) {
    // 1. Aktifkan Cooldown
    isCooldownRef.current = true;
    setIsPaused(true); // Beri feedback visual kalau scanner sedang "istirahat"
    
    // 2. Kirim hasil scan
    onScan(decodedText);

    // 3. Set timer untuk melepas Cooldown
    setTimeout(() => {
      isCooldownRef.current = false;
      setIsPaused(false);
    }, SCAN_DELAY);
  }

  async function stopScanning() {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
        setIsPaused(false);
        isCooldownRef.current = false;
      } catch (err) {
        console.warn(err);
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-md mx-auto">
      <div className="relative w-full">
        {/* Container Scanner */}
        <div
          id={containerId}
          className={`w-full rounded-lg overflow-hidden bg-black transition-all ${
            isScanning ? 'block min-h-[300px]' : 'hidden'
          }`}
        />

        {/* Overlay saat Cooldown (Delay) */}
        {isScanning && isPaused && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-10">
            <Loader2 className="h-10 w-10 animate-spin mb-2" />
            <p className="text-sm font-medium">Memproses... Mohon tunggu</p>
          </div>
        )}

        {/* Placeholder awal */}
        {!isScanning && (
          <div className="w-full h-[300px] flex flex-col items-center justify-center bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 gap-3">
            <Camera className="h-10 w-10 text-slate-400" />
            <p className="text-sm text-slate-500">
              {hasCamera ? 'Kamera siap digunakan' : 'Kamera tidak tersedia'}
            </p>
          </div>
        )}
      </div>

      <Button
        type="button"
        variant={'outline'}
        onClick={isScanning ? stopScanning : startScanning}
        className="w-full"
        disabled={!hasCamera}
      >
        {isScanning ? (
          <><CameraOff className="h-4 w-4 mr-2" /> Stop Scanner</>
        ) : (
          <><Camera className="h-4 w-4 mr-2" /> Mulai Scan QR</>
        )}
      </Button>

      {isPaused && (
        <p className="text-xs text-amber-600 font-medium animate-pulse">
          Scanner dijeda sementara untuk menghindari double-scan.
        </p>
      )}
    </div>
  );
}