import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { tripService } from '../../services/api';
import { toUserMessage } from '../../utils/errors';
import { useT } from '../../i18n';
import { Loader } from '../../components/common/Loader';
export const TripRating = () => {
    const { tripId } = useParams();
    const navigate = useNavigate();
    const { t } = useT();
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
        return <Loader label={t('trips.loadingOne')} />;
    const handleSubmit = async () => {
        if (rating === 0) {
            alert(t('trips.rating.chooseFirst'));
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            await tripService.submitRating(trip.id, rating, comment.trim() || undefined);
            alert(t('trips.rating.sent'));
            navigate('/app/trips');
        } catch (err) {
            setError(toUserMessage(err, t('trips.rating.failed')));
        } finally {
            setIsLoading(false);
        }
    };
    return (<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Card style={{ width: '100%', maxWidth: 500, textAlign: 'center', padding: 32 }}>
        <h2 style={{ marginBottom: 8 }}>{t('trips.rating.title', { id: trip.id })}</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 32 }}>{t('trips.rating.question', { name: trip.carrierName })}</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 32, direction: 'ltr' }}>
          {[1, 2, 3, 4, 5].map(star => (<button key={star} type="button" aria-label={t('trips.rating.stars', { count: star })} aria-pressed={star <= rating} onClick={() => setRating(star)} style={{
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

        <div style={{ textAlign: 'start' }}>
          <Input label={t('trips.rating.comment')} value={comment} onChange={e => setComment(e.target.value)} placeholder={t('trips.rating.commentPlaceholder')}/>
        </div>

        {error && (
          <div style={{ padding: 12, marginTop: 8, borderRadius: 8, backgroundColor: 'rgba(229,62,62,0.08)', color: 'var(--color-error)', fontSize: 13, textAlign: 'start' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, marginTop: 32 }}>
          <Button variant="outline" style={{ flex: 1 }} onClick={() => navigate('/app/trips')}>{t('trips.rating.skip')}</Button>
          <Button style={{ flex: 2 }} onClick={handleSubmit} isLoading={isLoading}>{t('trips.rating.submit')}</Button>
        </div>
      </Card>
    </div>);
};
