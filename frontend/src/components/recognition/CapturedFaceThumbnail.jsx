import { useEffect, useState } from 'react';
import { fetchCapturedFaceImageBlobUrl } from '../../api/recognitionApi';

// Same authenticated-blob pattern as StudentAvatar, but pointed at
// GET /recognition/images/{filename} instead of /students/images/{filename}
// -- these are two different endpoints/directories on the backend (a
// captured "who is this" frame is not a student's enrolled profile photo),
// so it can't reuse StudentAvatar directly.
//
// Falls back to a "?" placeholder (matching the pre-existing look for
// unrecognized rows) only while loading or if the image genuinely isn't
// available -- once the fetch resolves, this always shows the real face
// that was captured, not a generic question mark.
export default function CapturedFaceThumbnail({ capturedImageUrl, size = 40, rounded = true }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    let objectUrl;
    let cancelled = false;
    (async () => {
      try {
        objectUrl = await fetchCapturedFaceImageBlobUrl(capturedImageUrl);
        if (!cancelled) setSrc(objectUrl);
      } catch {
        if (!cancelled) setSrc(null);
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [capturedImageUrl]);

  const style = { width: size, height: size };
  const shape = rounded ? 'rounded-full' : 'rounded-lg';

  if (!src) {
    return (
      <div
        style={style}
        className={`flex shrink-0 items-center justify-center ${shape} bg-denied-100 text-sm font-semibold text-denied-600 dark:bg-denied-800/40 dark:text-denied-400`}
        aria-label="Unrecognized face photo unavailable"
      >
        ?
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="Unrecognized face captured by camera"
      style={style}
      className={`shrink-0 border border-slate-200 object-cover ${shape}`}
    />
  );
}
