import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ReviewSection = ({ movieId }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ averageRating: 0, reviewCount: 0 });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const [revRes, sumRes] = await Promise.all([
      api.get(`/reviews/movie/${movieId}`),
      api.get(`/reviews/movie/${movieId}/summary`),
    ]);
    setReviews(revRes.data);
    setSummary(sumRes.data);
  };

  useEffect(() => {
    load().catch(console.error);
  }, [movieId]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/reviews', { movieId: Number(movieId), rating, comment });
      toast?.success?.('Review submitted!');
      setComment('');
      load();
    } catch (err) {
      toast?.error?.(err.response?.data?.message || 'Could not submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="review-section">
      <h3>Ratings & Reviews</h3>
      <div className="review-summary">
        <Star fill="#ffc107" color="#ffc107" size={20} />
        <span>{summary.averageRating?.toFixed(1) || '—'}</span>
        <span className="review-count">({summary.reviewCount} reviews)</span>
      </div>

      {user && (
        <form className="review-form" onSubmit={submit}>
          <label>Your rating</label>
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{n} stars</option>
            ))}
          </select>
          <textarea
            placeholder="Write your review..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}

      <div className="review-list">
        {reviews.map((r) => (
          <div key={r.id} className="review-item">
            <div className="review-header">
              <strong>{r.username}</strong>
              <span>{'★'.repeat(r.rating)}</span>
            </div>
            <p>{r.comment}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ReviewSection;
