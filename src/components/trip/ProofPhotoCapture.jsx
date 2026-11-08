import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../common/Button';
import { Loader } from '../common/Loader';
import { toArabicError } from '../../utils/errors';

/**
 * A saved proof photo: a thumbnail that opens full size. Read-only — once a
 * proof is recorded it's evidence and can't be replaced.
 */
export const ProofPhotoView = ({ photo, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (!isOpen) return undefined;
        const onKey = (e) => { if (e.key === 'Escape') setIsOpen(false); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen]);

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {failed ? (
                <div style={{ width: 72, height: 72, borderRadius: 8, border: '1px dashed var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center', padding: 4 }}>
                    تعذّر تحميل الصورة
                </div>
            ) : (
                <button type="button" onClick={() => setIsOpen(true)} aria-label={`عرض ${label} بالحجم الكامل`} style={{ padding: 0, border: 'none', background: 'none', cursor: 'zoom-in' }}>
                    <img src={photo.photoDataUrl} alt={label} onError={() => setFailed(true)} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--color-border)', display: 'block', backgroundColor: 'var(--color-background)' }} />
                </button>
            )}
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                {photo.capturedAt && <div>{new Date(photo.capturedAt).toLocaleString('ar-SA')}</div>}
                {photo.lat != null && <div dir="ltr">{photo.lat.toFixed(5)}, {photo.lng.toFixed(5)}</div>}
                {!failed && <div>اضغط على الصورة لعرضها بالحجم الكامل</div>}
            </div>
            {isOpen && createPortal(
                <div role="dialog" aria-label={label} onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16 }}>
                    <img src={photo.photoDataUrl} alt={label} style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 96px)', objectFit: 'contain', borderRadius: 8 }} />
                    <Button variant="outline" onClick={() => setIsOpen(false)} style={{ backgroundColor: 'white' }}>إغلاق</Button>
                </div>,
                document.body
            )}
        </div>
    );
};

/**
 * Required proof-of-load / proof-of-delivery capture: camera (or a picked
 * image) + GPS fix. Nothing is uploaded until the carrier has seen the photo
 * and pressed «تأكيد» — then `onConfirm(proof, onProgress)` uploads it and
 * advances the stage, while this shows the progress with every photo button
 * disabled. If that fails, the preview comes back so it can be retried.
 */
export const ProofPhotoCapture = ({ label, onConfirm }) => {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const fileInputRef = useRef(null);
    const [step, setStep] = useState('idle'); // idle | camera | locating | preview | uploading
    const [isVideoReady, setIsVideoReady] = useState(false);
    const [proof, setProof] = useState(null); // { photoDataUrl, lat, lng, capturedAt }
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');

    useEffect(() => () => stopCamera(), []);

    const stopCamera = () => {
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        setIsVideoReady(false);
    };

    const openCamera = async () => {
        setError('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            streamRef.current = stream;
            setStep('camera');
            // Video element mounts on next render; attach once it exists.
            setTimeout(() => {
                if (videoRef.current) videoRef.current.srcObject = stream;
            }, 0);
        } catch {
            setError('تعذّر الوصول إلى الكاميرا. يرجى السماح بالوصول للكاميرا من إعدادات المتصفح، أو اختر صورة من الجهاز.');
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

    // The backend requires a GPS fix with every proof (recordTripProof), so
    // it's taken with the photo — before the preview, not after confirming.
    const toPreview = async (photoDataUrl) => {
        setError('');
        setStep('locating');
        const location = await getLocation();
        if (!location) {
            setError('تعذّر تحديد موقعك — اسمح للمتصفح بالوصول إلى الموقع ثم أعد المحاولة.');
            setStep('idle');
            return;
        }
        setProof({ photoDataUrl, lat: location.lat, lng: location.lng, capturedAt: new Date().toISOString() });
        setStep('preview');
    };

    const capture = async () => {
        const video = videoRef.current;
        // Drawing before the camera has delivered a frame produces a solid
        // black image — the capture button stays disabled until it has.
        if (!video || !video.videoWidth) return;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        const photoDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        stopCamera();
        await toPreview(photoDataUrl);
    };

    // For devices without a camera (e.g. a desktop): pick an image.
    const pickFile = (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            setError('يرجى اختيار صورة بصيغة JPG أو PNG.');
            return;
        }
        if (file.size >= 5 * 1024 * 1024) {
            setError('حجم الصورة يجب أن يكون أقل من 5 ميجابايت.');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => toPreview(reader.result);
        reader.readAsDataURL(file);
    };

    const retake = () => {
        setProof(null);
        setError('');
        setStep('idle');
    };

    const confirm = async () => {
        setError('');
        setProgress(0);
        setStep('uploading');
        try {
            await onConfirm(proof, setProgress);
            // On success the parent re-renders with the saved photo instead.
        } catch (err) {
            setError(toArabicError(err, 'تعذّر رفع الصورة — تحقق من الاتصال وحاول مرة أخرى.'));
            setStep('preview');
        }
    };

    const isBusy = step === 'uploading';

    return (
        <div>
            {error && <div role="alert" style={{ color: 'var(--color-error)', fontSize: 12, marginBottom: 8 }}>{error}</div>}

            {step === 'camera' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        onLoadedData={() => setIsVideoReady(true)}
                        style={{ width: '100%', maxWidth: 360, borderRadius: 8, backgroundColor: '#000' }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Button size="sm" onClick={capture} disabled={!isVideoReady}>{isVideoReady ? 'التقاط الصورة' : 'جاري تشغيل الكاميرا'}</Button>
                        <Button size="sm" variant="outline" onClick={() => { stopCamera(); setStep('idle'); }}>إلغاء</Button>
                    </div>
                </div>
            )}

            {step === 'locating' && <Loader variant="inline" label="جاري تحديد موقعك" />}

            {(step === 'preview' || step === 'uploading') && proof && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <img src={proof.photoDataUrl} alt="معاينة الصورة" style={{ width: '100%', maxWidth: 360, borderRadius: 8, border: '1px solid var(--color-border)' }} />
                    {step === 'preview' && (
                        <p className="text-helper" style={{ margin: 0, fontSize: 12 }}>
                            تأكد من وضوح الصورة — بعد التأكيد تُحفظ كإثبات ولا يمكن تغييرها.
                        </p>
                    )}
                    {isBusy && (
                        <div role="status" aria-live="polite">
                            <div style={{ height: 6, borderRadius: 999, backgroundColor: 'var(--color-border)', overflow: 'hidden', maxWidth: 360 }}>
                                <div style={{ width: `${progress}%`, height: '100%', backgroundColor: 'var(--color-accent)', transition: 'width 0.2s ease' }} />
                            </div>
                            <div className="text-helper" style={{ fontSize: 12, marginTop: 4 }}>
                                {progress < 100 ? `جاري رفع الصورة ${progress}%` : 'جاري تأكيد المرحلة'}
                            </div>
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Button size="sm" variant="outline" onClick={retake} disabled={isBusy}>إعادة التقاط</Button>
                        <Button size="sm" onClick={confirm} isLoading={isBusy} disabled={isBusy}>تأكيد</Button>
                    </div>
                </div>
            )}

            {step === 'idle' && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Button variant="outline" size="sm" onClick={openCamera}>{label}</Button>
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>أو اختر صورة من الجهاز</Button>
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" onChange={pickFile} style={{ display: 'none' }} />
                </div>
            )}
        </div>
    );
};
