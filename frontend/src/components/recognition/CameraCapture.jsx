import { useEffect, useRef, useState } from 'react';
import * as recognitionApi from '../../api/recognitionApi';
import { captureVideoFrameAsBase64 } from '../../utils/formatters';
import { extractErrorMessage } from '../common/ErrorMessage';
import ScanFrame from '../ui/ScanFrame';
import Button from '../ui/Button';
import ErrorIllustration from '../../illustrations/ErrorIllustration';

// camera: string (camera identifier, e.g. "CAM01")
// onResult: (RecognitionResponse) => void
export default function CameraCapture({ camera, onResult }) {
  const videoRef = useRef(null);
  // Stream lives in a ref (not just state) so the unmount cleanup below
  // always reads the *current* stream rather than the value captured when
  // the effect was first created -- see git history for the stale-closure
  // bug this previously caused (camera never actually turned off).
  const streamRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [permissionState, setPermissionState] = useState('requesting'); // requesting | granted | denied
  const [identifying, setIdentifying] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((s) => {
        if (!active) {
          // Component unmounted while the permission prompt/getUserMedia call
          // was still pending -- stop the stream immediately instead of leaking it.
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = s;
        setStream(s);
        setPermissionState('granted');
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setPermissionState('denied'));

    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleIdentify = async () => {
    if (!videoRef.current || !camera) return;
    setIdentifying(true);
    setError(null);
    try {
      const base64 = captureVideoFrameAsBase64(videoRef.current);
      const result = await recognitionApi.identifyFace(camera, base64);
      onResult(result);
    } catch (err) {
      setError(extractErrorMessage(err, 'Recognition failed. Please try again.'));
    } finally {
      setIdentifying(false);
    }
  };

  if (permissionState === 'denied') {
    return (
      <div className="card flex flex-col items-center gap-3 p-8 text-center">
        <ErrorIllustration className="h-28 w-28" />
        <div>
          <p className="font-display font-semibold text-ink dark:text-slate-100">Camera access is blocked</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Grant camera permission in your browser's site settings, then reload this page to start recognizing entries.
          </p>
        </div>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Reload page
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ScanFrame active={identifying} className="bg-black">
        <video ref={videoRef} autoPlay playsInline muted className="mx-auto max-h-96 w-full object-contain" />
        {permissionState === 'requesting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/80 text-sm text-white">
            Waiting for camera permission…
          </div>
        )}
      </ScanFrame>

      {error && (
        <div role="alert" className="rounded-lg border border-denied-500/30 bg-denied-50 px-3 py-2 text-sm text-denied-700">
          {error}
        </div>
      )}

      <Button
        onClick={handleIdentify}
        loading={identifying}
        disabled={!stream || !camera}
        className="w-full"
      >
        {identifying ? 'Verifying…' : 'Capture & Verify'}
      </Button>
    </div>
  );
}
