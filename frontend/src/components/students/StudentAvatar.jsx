import { useEffect, useState } from 'react';
import { fetchStudentImageBlobUrl } from '../../api/studentApi';

// The backend serves /students/images/{filename} behind JWT auth, so a plain
// <img src="..."> can't attach the Authorization header. We fetch the bytes
// via axios (which does attach it) and render an object URL instead.
export default function StudentAvatar({ profileImageUrl, name, size = 48 }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    let objectUrl;
    let cancelled = false;
    (async () => {
      try {
        objectUrl = await fetchStudentImageBlobUrl(profileImageUrl);
        if (!cancelled) setSrc(objectUrl);
      } catch {
        if (!cancelled) setSrc(null);
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [profileImageUrl]);

  const initials = (name || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const style = { width: size, height: size };

  if (!src) {
    return (
      <div
        style={style}
        className="flex shrink-0 items-center justify-center rounded-full bg-brass-100 text-sm font-semibold text-brass-700"
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      style={style}
      className="shrink-0 rounded-full border border-slate-200 object-cover"
    />
  );
}
