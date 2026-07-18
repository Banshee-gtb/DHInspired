import { useState, useEffect } from 'react';
import { Star, MessageSquare, Send, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ProductReview } from '@/lib/types';
import { toast } from 'sonner';

interface ProductReviewsProps {
  productId: string;
  onAvgRatingUpdate?: (avg: number, count: number) => void;
}

function StarRating({ value, onChange, readonly = false, size = 'md' }: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [hovered, setHovered] = useState(0);
  const sz = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-7 h-7' : 'w-5 h-5';

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={readonly ? 'button' : 'button'}
          disabled={readonly}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          onClick={() => !readonly && onChange?.(star)}
          className={`transition-all ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
        >
          <Star
            className={`${sz} transition-colors ${
              (hovered || value) >= star
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-200 fill-gray-200'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: ProductReview }) {
  const date = new Date(review.created_at).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-blue-100 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{review.customer_name}</p>
            <p className="text-[10px] text-gray-400">{date}</p>
          </div>
        </div>
        <StarRating value={review.rating} readonly size="sm" />
      </div>
      {review.review_text && (
        <p className="text-sm text-gray-600 leading-relaxed pl-10">{review.review_text}</p>
      )}
    </div>
  );
}

export default function ProductReviews({ productId, onAvgRatingUpdate }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', rating: 0, text: '' });

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (data) {
      setReviews(data as ProductReview[]);
      if (data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        onAvgRatingUpdate?.(avg, data.length);
      } else {
        onAvgRatingUpdate?.(0, 0);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Please enter your name'); return; }
    if (form.rating === 0) { toast.error('Please select a star rating'); return; }

    setSubmitting(true);
    const { error } = await supabase.from('product_reviews').insert({
      product_id: productId,
      customer_name: form.name.trim(),
      rating: form.rating,
      review_text: form.text.trim(),
    });

    if (error) {
      toast.error('Failed to submit review. Try again.');
      setSubmitting(false);
      return;
    }

    toast.success('Review submitted! Thank you.');
    setForm({ name: '', rating: 0, text: '' });
    setShowForm(false);
    await fetchReviews();
    setSubmitting(false);
  };

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="mt-12 pt-10 border-t border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="section-tag">Community</span>
          <h2 className="font-display text-4xl text-navy-950 tracking-wider">REVIEWS</h2>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="dh-btn-primary flex items-center gap-2 text-xs py-3"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            WRITE A REVIEW
          </button>
        )}
      </div>

      {/* Summary */}
      {reviews.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-6 bg-gray-50 rounded-2xl p-6 mb-8">
          <div className="flex flex-col items-center justify-center min-w-[120px]">
            <p className="font-black text-5xl text-navy-950">{avgRating.toFixed(1)}</p>
            <StarRating value={Math.round(avgRating)} readonly size="md" />
            <p className="text-xs text-gray-400 mt-1 font-medium">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {ratingCounts.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 w-3">{star}</span>
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                    style={{ width: reviews.length > 0 ? `${(count / reviews.length) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-4 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-gray-900 uppercase tracking-wider text-sm">Your Review</h3>
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm({ name: '', rating: 0, text: '' }); }}
              className="text-xs text-gray-400 hover:text-gray-600 font-bold"
            >
              Cancel
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="dh-label">Your Name *</label>
              <input
                required
                className="dh-input"
                placeholder="How should we credit your review?"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="dh-label">Rating *</label>
              <div className="mt-1">
                <StarRating
                  value={form.rating}
                  onChange={(v) => setForm((f) => ({ ...f, rating: v }))}
                  size="lg"
                />
              </div>
              {form.rating > 0 && (
                <p className="text-xs text-blue-600 font-bold mt-1">
                  {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][form.rating]}
                </p>
              )}
            </div>
            <div>
              <label className="dh-label">Review (Optional)</label>
              <textarea
                className="dh-input resize-none"
                rows={3}
                placeholder="Share your experience with this product..."
                value={form.text}
                onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="dh-btn-primary w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                <><Send className="w-4 h-4" /> SUBMIT REVIEW</>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <Star className="w-10 h-10 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">No reviews yet</p>
          <p className="text-gray-400 text-xs mt-1">Be the first to share your experience</p>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="mt-4 dh-btn-primary text-xs py-2.5 px-5">
              WRITE FIRST REVIEW
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}
    </div>
  );
}

// Export StarRating for use in ProductCard
export { StarRating };
