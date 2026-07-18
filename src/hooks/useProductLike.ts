import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Stable per-device fingerprint stored in localStorage
function getFingerprint(): string {
  const key = 'dh_fp';
  let fp = localStorage.getItem(key);
  if (!fp) {
    fp = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(key, fp);
  }
  return fp;
}

export function useProductLike(productId: string) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const fingerprint = getFingerprint();

  useEffect(() => {
    if (!productId) return;
    // Fetch count + check if this device liked
    Promise.all([
      supabase.from('product_likes').select('id', { count: 'exact', head: true }).eq('product_id', productId),
      supabase.from('product_likes').select('id').eq('product_id', productId).eq('fingerprint', fingerprint).maybeSingle(),
    ]).then(([countRes, likedRes]) => {
      setLikeCount(countRes.count ?? 0);
      setLiked(!!likedRes.data);
      setLoading(false);
    });
  }, [productId]);

  const toggleLike = async () => {
    if (loading) return;
    if (liked) {
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
      await supabase
        .from('product_likes')
        .delete()
        .eq('product_id', productId)
        .eq('fingerprint', fingerprint);
    } else {
      setLiked(true);
      setLikeCount((c) => c + 1);
      await supabase
        .from('product_likes')
        .insert({ product_id: productId, fingerprint });
    }
  };

  return { liked, likeCount, toggleLike, loading };
}
