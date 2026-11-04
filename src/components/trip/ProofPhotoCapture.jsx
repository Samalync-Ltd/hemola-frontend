import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../common/Button';
import { Loader } from '../common/Loader';

/**
 * Required proof-of-load / proof-of-delivery capture: browser camera
 * (getUserMedia) + geolocation, timestamped, matching mobile's requirement
 * at the LOADED and DELIVERED stages exactly (see trips_provider.dart).
 *
 * `onCaptured` fires as soon as the photo + GPS fix are in hand; the caller
 * uploads it (tripService.updateTripStage) before advancing the stage. A
 * file picker is offered next to the camera for devices without one.
 */
export const ProofPhotoCapture = ({ label, onCaptured, existingPhoto }) => {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const fileInputRef = useRef(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [error, setError] = useState('');

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

    // Shared by the camera and the file picker. Against the real backend the
    // GPS fix is mandatory (recordTripProof rejects missing coords) and the
    // upload happens for real inside tripService.updateTripStage, so there
    // is nothing to simulate afterwards.
    const submitPhoto = async (photoDataUrl) => {
        setError('');
        setIsLocating(true);
        const location = await getLocation();
        setIsLocating(false);
        if (!location) {
            setError('تعذّر تحديد موقعك — اسمح للمتصفح بالوصول إلى الموقع ثم أعد المحاولة.');
            return;
        }
        const capturedAt = new Date().toISOString();
        onCaptured({ photoDataUrl, lat: location?.lat ?? null, lng: location?.lng ?? null, capturedAt });
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
        await submitPhoto(photoDataUrl);
    };

    // Fallback for devices without a camera (e.g. a desktop): pick an image.
    const pickFile = (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setError('يرجى اختيار صورة.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('حجم الصورة يجب أن يكون أقل من 5 ميجابايت.');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => submitPhoto(reader.result);
        reader.readAsDataURL(file);
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
            ) : isLocating ? (
                <Loader variant="inline" label="جاري تحديد موقعك" />
            ) : (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Button variant="outline" size="sm" onClick={openCamera}>{label}</Button>
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>أو اختر صورة من الجهاز</Button>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={pickFile} style={{ display: 'none' }} />
                </div>
            )}
        </div>
    );
};
