import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Icon } from './ui.jsx';

// Replace with the real smart-link (e.g. an app.link / onelink URL that routes iOS → App Store, Android → Play).
export const APP_DOWNLOAD_URL = 'https://example.com/get-dirham-desk';

export function useQr(size) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    QRCode.toDataURL(APP_DOWNLOAD_URL, { width: size, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#12161a', light: '#ffffff' } }).then(setSrc).catch(() => setSrc(''));
  }, [size]);
  return src;
}

export function QrBadge({ onOpen }) {
  const src = useQr(160);
  return (
    <button type="button" onClick={onOpen} className="btn !gap-3 !py-1.5 !pl-2 text-left" aria-label="Scan to download the mobile app, open full-screen QR code">
      <span className="well flex h-11 w-11 items-center justify-center !rounded-lg bg-white p-0.5">{src ? <img src={src} alt="" className="h-full w-full" /> : <Icon.qr />}</span>
      <span className="hidden leading-tight sm:block">
        <span className="block font-display text-[15px] font-bold uppercase tracking-wide">Scan for the app</span>
        <span className="block text-xs text-steel-600">iOS &amp; Android</span>
      </span>
    </button>
  );
}

export function QrModal({ onClose }) {
  const src = useQr(480);
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Download the mobile app" onClick={onClose}>
      <div className="panel w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide">Scan to download</h2>
        <p className="mt-1 text-sm text-steel-600">Mobile app for iOS &amp; Android</p>
        <div className="well mx-auto mt-4 aspect-square w-full max-w-[300px] bg-white p-3">{src && <img src={src} alt="QR code linking to the mobile app download page" className="h-full w-full" />}</div>
        <p className="mt-3 break-all font-mono text-xs text-steel-500">{APP_DOWNLOAD_URL}</p>
        <button type="button" className="btn btn-primary mt-4 w-full" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}
