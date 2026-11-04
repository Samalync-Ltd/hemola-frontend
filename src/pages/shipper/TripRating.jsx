import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { tripService } from '../../services/api';
import { toArabicError } from '../../utils/errors';
import { Loader } from '../../components/common/Loader';
export const TripRating = () => {
    const { tripId } = useParams();
    const navigate = useNavigate();
    const [trip, setTrip] = useState(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        if (tripId) {
            tripService.getTripById(tripId).then(setTrip);
        }
    }, [tripId]);
    if (!trip)
        return <Loader label="جاري تحميل الرحلة" />;
    const handleSubmit = async () => {
        if (rating === 0) {
            alert('الرجاء اختيار التقييم أولاً');
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            await tripService.submitRating(trip.id, rating, comment.trim() || undefined);
            alert('تم إرسال التقييم بنجاح. شكراً لك!');
            navigate('/app/trips');
        } catch (err) {
            setError(toArabicError(err, 'حدث خطأ أثناء إرسال التقييم'));
        } finally {
            setIsLoading(false);
        }
    };
    return (<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Card style={{ width: '100%', maxWidth: 500, textAlign: 'center', padding: 32 }}>
        <h2 style={{ marginBottom: 8 }}>تقييم الرحلة {trip.id}</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 32 }}>كيف كانت تجربتك مع الناقل {trip.carrierName}؟</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 32, direction: 'ltr' }}>
          {[1, 2, 3, 4, 5].map(star => (<button key={star} onClick={() => setRating(star)} style={{
                background: 'none',
                border: 'none',
                fontSize: 48,
                cursor: 'pointer',
                color: star <= rating ? 'var(--color-accent)' : 'var(--color-border)',
                transition: 'color 0.2s'
            }}>
              ★
            </button>))}
        </div>

        <div style={{ textAlign: 'right' }}>
          <Input label="تعليق إضافي (اختياري)" value={comment} onChange={e => setComment(e.target.value)} placeholder="اكتب تعليقك هنا..."/>
        </div>

        {error && (
          <div style={{ padding: 12, marginTop: 8, borderRadius: 8, backgroundColor: 'rgba(229,62,62,0.08)', color: 'var(--color-error)', fontSize: 13, textAlign: 'right' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, marginTop: 32 }}>
          <Button variant="outline" style={{ flex: 1 }} onClick={() => navigate('/app/trips')}>تخطي</Button>
          <Button style={{ flex: 2 }} onClick={handleSubmit} isLoading={isLoading}>إرسال التقييم</Button>
        </div>
      </Card>
    </div>);
};
