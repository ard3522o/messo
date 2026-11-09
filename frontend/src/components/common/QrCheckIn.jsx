import { useEffect, useId, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, QrCode, ScanLine, AlertCircle } from 'lucide-react';
import { Button } from '../ui';

export default function QrCheckIn({ onDetected, processing }) {
  const regionId = `qr-reader-${useId().replace(/:/g, '')}`;
  const scannerRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [manualCode, setManualCode] = useState('');

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch {
        /* scanner already stopped */
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const startScanner = async () => {
    setCameraError('');
    try {
      const scanner = new Html5Qrcode(regionId, { verbose: false });
      scannerRef.current = scanner;
      setScanning(true);
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 230, height: 230 } },
        async (decodedText) => {
          await stopScanner();
          onDetected(decodedText);
        },
        () => {}
      );
    } catch (error) {
      setScanning(false);
      setCameraError(
        'Camera unavailable. Allow camera access, or paste the code shown at the mess counter below.'
      );
    }
  };

  useEffect(
    () => () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    },
    []
  );

  return (
    <div>
      <div className={`relative overflow-hidden rounded-2xl border ${scanning ? 'border-brand-300 bg-navy-950' : 'border-slate-200 bg-slate-50'}`}>
        <div id={regionId} className="mx-auto w-full max-w-md [&_video]:rounded-xl" />
        {!scanning && (
          <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-soft">
              <QrCode className="h-8 w-8" />
            </div>
            <p className="mt-4 text-sm font-bold text-navy-900">Scan the mess counter QR</p>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
              Ask the mess staff to display today’s meal QR, then scan it here to mark your attendance.
            </p>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {scanning ? (
          <Button variant="secondary" icon={CameraOff} onClick={stopScanner}>
            Stop camera
          </Button>
        ) : (
          <Button variant="indigo" icon={Camera} onClick={startScanner}>
            Open camera
          </Button>
        )}
      </div>

      {cameraError && (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] font-medium text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {cameraError}
        </p>
      )}

      <div className="mt-5 border-t border-dashed border-slate-200 pt-4">
        <label htmlFor="manual-qr" className="label">Or paste the counter code manually</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="manual-qr"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Paste the QR code text"
            className="input flex-1"
          />
          <Button
            variant="primary"
            icon={ScanLine}
            loading={processing}
            disabled={!manualCode.trim()}
            onClick={() => {
              onDetected(manualCode.trim());
              setManualCode('');
            }}
          >
            Mark attendance
          </Button>
        </div>
      </div>
    </div>
  );
}
