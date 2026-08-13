import { useEffect, useRef, useState } from 'react';
import * as studentApi from '../../api/studentApi';
import { POSES } from '../../utils/constants';
import { titleCase, captureVideoFrameAsBase64 } from '../../utils/formatters';
import { extractErrorMessage } from '../common/ErrorMessage';
import ScanFrame from '../ui/ScanFrame';
import Button from '../ui/Button';

const POSE_HINTS = {
  STRAIGHT: 'Look straight at the camera',
  LEFT: 'Turn your head slightly left',
  RIGHT: 'Turn your head slightly right',
  UP: 'Tilt your head slightly up',
  DOWN: 'Tilt your head slightly down',
};

// studentId: number, onComplete: (StudentResponse) => void
export default function EnrollmentCapture({ studentId, onComplete }) {
  const videoRef = useRef(null);
  // Ref (not just state) for the same reason CameraCapture.jsx uses one: the
  // unmount cleanup below must always read the *current* stream, not the
  // value captured when this effect first ran.
  const streamRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [permissionState, setPermissionState] = useState('requesting'); // requesting | granted | denied
  const [poseIndex, setPoseIndex] = useState(0);
  const [captured, setCaptured] = useState({}); // pose -> true once accepted
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [lastQuality, setLastQuality] = useState(null);
  const [completing, setCompleting] = useState(false);

  const currentPose = POSES[poseIndex];
  const allCaptured = POSES.every((p) => captured[p]);
  const capturedCount = POSES.filter((p) => captured[p]).length;

  const startCamera = () => {
    setPermissionState('requesting');
    let active = true;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((s) => {
        if (!active) {
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
    };
  };

  useEffect(() => {
    const cancelPending = startCamera();
    return () => {
      cancelPending();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const captureFrame = async () => {
    if (!videoRef.current) return;
    setBusy(true);
    setError(null);
    try {
      const base64 = captureVideoFrameAsBase64(videoRef.current);
      const result = await studentApi.uploadEnrollmentFrame(studentId, currentPose, base64);
      setLastQuality(result);
      if (result.accepted) {
        setCaptured((c) => ({ ...c, [currentPose]: true }));
        if (poseIndex < POSES.length - 1) {
          setPoseIndex((i) => i + 1);
        }
      } else {
        setError(result.reason || 'Frame rejected. Please adjust and try again.');
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to process the captured frame.'));
    } finally {
      setBusy(false);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    setError(null);
    try {
      const student = await studentApi.completeEnrollment(studentId);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      onComplete(student);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to complete enrollment. All 5 poses are required.'));
    } finally {
      setCompleting(false);
    }
  };

  if (permissionState === 'denied') {
    return (
      <div className="card flex flex-col items-center gap-3 p-8 text-center">
        <p className="text-sm text-ink dark:text-slate-100">Camera access is blocked.</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Grant camera permission in your browser's site settings, then retry.</p>
        <Button variant="secondary" onClick={startCamera}>
          Retry camera access
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress stepper -- each pose is a step; the current step is
          highlighted, completed steps show a check, remaining steps stay
          muted. Distinct from a plain badge row: it visually connects the
          steps with a track and communicates *sequence*, not just status. */}
      <ol className="flex items-center">
        {POSES.map((p, i) => {
          const isDone = !!captured[p];
          const isCurrent = i === poseIndex && !allCaptured;
          return (
            <li key={p} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                    isDone
                      ? 'bg-verified-500 text-white'
                      : isCurrent
                      ? 'bg-brass-500 text-white'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-700'
                  }`}
                >
                  {isDone ? '✓' : i + 1}
                </div>
                <span className={`text-[11px] ${isCurrent ? 'font-medium text-ink dark:text-slate-100' : 'text-slate-400'}`}>
                  {titleCase(p)}
                </span>
              </div>
              {i < POSES.length - 1 && (
                <div className={`mx-2 h-0.5 flex-1 ${isDone ? 'bg-verified-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
              )}
            </li>
          );
        })}
      </ol>
      <p className="text-center text-xs text-slate-400">{capturedCount} of {POSES.length} poses captured</p>

      <ScanFrame active={busy} className="bg-black">
        <video ref={videoRef} autoPlay playsInline muted className="mx-auto max-h-80 w-full object-contain" />
        {permissionState === 'requesting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/80 text-sm text-white">
            Waiting for camera permission…
          </div>
        )}
      </ScanFrame>

      {error && (
        <div className="rounded-lg border border-denied-500/30 bg-denied-50 px-3 py-2 text-sm text-denied-700">
          {error}
        </div>
      )}

      {lastQuality && !lastQuality.accepted && lastQuality.quality && (
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 sm:grid-cols-4">
          <span>Face detected: {lastQuality.quality.faceDetected ? 'Yes' : 'No'}</span>
          <span>Single face: {lastQuality.quality.singleFace ? 'Yes' : 'No'}</span>
          <span>Lighting: {lastQuality.quality.lighting}</span>
          <span>Centered: {lastQuality.quality.centered ? 'Yes' : 'No'}</span>
        </div>
      )}

      {!allCaptured ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600 dark:text-slate-300">{POSE_HINTS[currentPose]}</p>
          <Button onClick={captureFrame} loading={busy} disabled={!stream}>
            {busy ? 'Checking…' : `Capture "${titleCase(currentPose)}"`}
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-lg bg-verified-50 px-4 py-3">
          <p className="text-sm text-verified-700">All 5 poses captured. Ready to finish enrollment.</p>
          <Button onClick={handleComplete} loading={completing}>
            {completing ? 'Finishing…' : 'Complete Enrollment'}
          </Button>
        </div>
      )}
    </div>
  );
}
