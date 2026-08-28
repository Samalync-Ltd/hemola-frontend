import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../common/Button';

/**
 * Required proof-of-load / proof-of-delivery capture: browser camera
 * (getUserMedia) + geolocation, timestamped, matching mobile's requirement
 * at the LOADED and DELIVERED stages exactly (see trips_provider.dart).
 *
 * The capture itself completes the stage immediately — `onCaptured` fires
 * as soon as the photo + GPS fix are in hand — while the "upload" is
 * simulated asynchronously afterward (same 2200ms delay / ~35% first-try
 * failure / 6s auto-retry timing mobile uses), never blocking the stage
 * update on the upload finishing.
 */
export const ProofPhotoCapture = ({ label, onCaptured, existingPhoto }) => {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [error, setError] = useState('');
    const [uploadStatus, setUploadStatus] = useState(existingPhoto ? 'uploaded' : null);

    useEffect(() => () => stopCamera(), []);

    const stopCamera = () => {
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    };

    const openCamera = async () => {
        setError('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            streamRef.current = stream;
            setIsCameraOpen(true);
            // Video element mounts on next render; attach once it exists.
            setTimeout(() => {
                if (videoRef.current) videoRef.current.srcObject = stream;
            }, 0);
        } catch {
            setError('تعذّر الوصول إلى الكاميرا. يرجى السماح بالوصول للكاميرا من إعدادات المتصفح.');
        }
    };

    const getLocation = () => new Promise((resolve) => {
        if (!('geolocation' in navigator)) { resolve(null); return; }
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 8000 }
        );
    });

    const simulateUpload = () => {
        setUploadStatus('uploading');
        setTimeout(() => {
            const failed = Math.random() < 0.35;
            if (failed) {
                setUploadStatus('retrying');
                setTimeout(() => setUploadStatus('uploaded'), 6000);
            } else {
                setUploadStatus('uploaded');
            }
        }, 2200);
    };

    const capture = async () => {
        const video = videoRef.current;
        if (!video) return;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);

        stopCamera();
        setIsCameraOpen(false);

        const location = await getLocation();
        const capturedAt = new Date().toISOString();
        // Stage advances immediately — upload happens in the background.
        onCaptured({ photoDataUrl, lat: location?.lat ?? null, lng: location?.lng ?? null, capturedAt });
        simulateUpload();
    };

    const uploadStatusLabel = {
        uploading: 'جارِ الرفع...',
        retrying: 'فشل الرفع — إعادة المحاولة تلقائياً...',
        uploaded: 'تم الرفع بنجاح',
    };

    if (existingPhoto) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src={existingPhoto.photoDataUrl} alt={label} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--color-border)' }} />
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    <div>{new Date(existingPhoto.capturedAt).toLocaleString('ar-SA')}</div>
                    {existingPhoto.lat != null && (
                        <div dir="ltr">{existingPhoto.lat.toFixed(5)}, {existingPhoto.lng.toFixed(5)}</div>
                    )}
                    {uploadStatus && uploadStatus !== 'uploaded' && (
                        <div style={{ color: uploadStatus === 'retrying' ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
                            {uploadStatusLabel[uploadStatus]}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div>
            {error && <div style={{ color: 'var(--color-error)', fontSize: 12, marginBottom: 8 }}>{error}</div>}
            {isCameraOpen ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxWidth: 320, borderRadius: 8, backgroundColor: '#000' }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Button size="sm" onClick={capture}>التقاط الصورة</Button>
                        <Button size="sm" variant="outline" onClick={() => { stopCamera(); setIsCameraOpen(false); }}>إلغاء</Button>
                    </div>
                </div>
            ) : (
                <Button variant="outline" size="sm" onClick={openCamera}>{label}</Button>
            )}
        </div>
    );
};
