import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { tripService } from '../../services/api';
export const TripRating = () => {
    const { tripId } = useParams();
    const navigate = useNavigate();
    const [trip, setTrip] = useState(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    useEffect(() => {
        if (tripId) {
            tripService.getTripById(tripId).then(setTrip);
        }
    }, [tripId]);
    if (!trip)
        return <div>جاري التحميل...</div>;
    const handleSubmit = () => {
        if (rating === 0) {
            alert('الرجاء اختيار التقييم أولاً');
            return;
        }
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            alert('تم إرسال التقييم بنجاح. شكراً لك!');
            navigate('/app/trips');
        }, 1000);
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

        <div style={{ display: 'flex', gap: 16, marginTop: 32 }}>
          <Button variant="outline" style={{ flex: 1 }} onClick={() => navigate('/app/trips')}>تخطي</Button>
          <Button style={{ flex: 2 }} onClick={handleSubmit} isLoading={isLoading}>إرسال التقييم</Button>
        </div>
      </Card>
    </div>);
};
