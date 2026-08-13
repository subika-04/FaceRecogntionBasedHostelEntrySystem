import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// jsdom has no camera API at all -- CameraCapture and anything that touches
// navigator.mediaDevices needs this stub to avoid throwing on import/mount.
// Individual tests can override this with vi.spyOn(...) for specific behavior
// (granted / denied / a real MediaStream-like fake).
if (!navigator.mediaDevices) {
  Object.defineProperty(navigator, 'mediaDevices', {
    writable: true,
    value: {},
  });
}
navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(new Error('no camera in test environment'));

// jsdom doesn't implement Blob URL creation, which the CSV/JSON download
// helpers (csvExport.js) rely on to trigger a browser download. Stubbed
// here once, same rationale as the mediaDevices/matchMedia stubs above.
if (!URL.createObjectURL) {
  URL.createObjectURL = vi.fn(() => 'blob:mock-url');
}
if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = vi.fn();
}
// matchMedia is used by some libraries (and would be used by any
// prefers-reduced-motion-aware component logic) but jsdom doesn't implement it.
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}
