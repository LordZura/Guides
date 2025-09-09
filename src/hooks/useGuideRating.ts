import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

type GuideData = {
  average_rating?: number | string;
  total_reviews?: number | string;
  reviews_count?: number | string;
  rating_counts?: Record<number, number> | Record<string, number> | string | null;
  [key: string]: any;
};

type NormalizedSummary = {
  avg: number;
  total: number;
  counts: Record<number, number>;
};

export const useGuideRating = (guideId: string, existingData?: GuideData) => {
  const [averageRating, setAverageRating] = useState<number>(
    existingData?.average_rating ? Number(existingData.average_rating) : 0
  );
  const [reviewCount, setReviewCount] = useState<number>(
    existingData?.reviews_count ? Number(existingData.reviews_count) : 0
  );
  const [ratingCounts, setRatingCounts] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const parseCounts = (rawCounts: GuideData['rating_counts']): Record<number, number> => {
    const result: Record<number, number> = {};
    if (!rawCounts) return result;

    // If it's a JSON string, try to parse it
    let obj: unknown = rawCounts;
    if (typeof rawCounts === 'string') {
      try {
        obj = JSON.parse(rawCounts);
      } catch {
        // fallback: try to replace single quotes then parse
        try {
          obj = JSON.parse(rawCounts.replace(/'/g, '"'));
        } catch {
          obj = null;
        }
      }
    }

    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      // obj is likely Record<string, any>
      const entries = Object.entries(obj as Record<string, unknown>);
      for (const [k, v] of entries) {
        const keyNum = Number(k);
        // If key is not numeric, skip
        if (Number.isNaN(keyNum)) continue;
        const valNum = Number((v as unknown) ?? 0);
        result[keyNum] = Number.isNaN(valNum) ? 0 : valNum;
      }
    }

    return result;
  };

  const normalizeSummary = (raw: any): NormalizedSummary => {
    if (!raw) return { avg: 0, total: 0, counts: {} };

    const summary: any = Array.isArray(raw) ? raw[0] ?? {} : raw;

    const avgRaw = summary.average_rating ?? summary.averageRating ?? summary.avg ?? summary.avg_rating;
    const totalRaw = summary.total_reviews ?? summary.totalReviews ?? summary.reviews_count ?? summary.reviewsCount;
    const countsRaw = summary.rating_counts ?? summary.ratingCounts ?? summary.counts ?? summary.rating_count;

    const avg = (() => {
      const n = Number(avgRaw);
      return Number.isNaN(n) ? 0 : n;
    })();

    const total = (() => {
      const n = Number(totalRaw);
      return Number.isNaN(n) ? 0 : n;
    })();

    const counts = parseCounts(countsRaw);

    return { avg, total, counts };
  };

  const fetchRatingData = useCallback(async () => {
    if (!guideId) {
      console.log('useGuideRating - Early return: No guideId provided');
      return;
    }

    console.log(`useGuideRating - Fetching rating data for guide: ${guideId}`);
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_review_summary', {
        target_id_param: guideId,
        target_type_param: 'guide',
      });

      if (error) {
        console.error('Error fetching guide rating:', error);
        throw error;
      }

      console.log('Raw summary data returned from RPC:', data);

      const { avg, total, counts } = normalizeSummary(data);

      console.log(`Normalized summary for guide ${guideId}:`, { avg, total, counts });

      setAverageRating(avg);
      setReviewCount(total);
      setRatingCounts(counts);
      console.log(`Updated rating for guide ${guideId}:`, avg, total);
    } catch (err) {
      console.error('Error in fetchRatingData:', err);
    } finally {
      setIsLoading(false);
    }
  }, [guideId]);

  useEffect(() => {
    const handleRatingUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Event received:', customEvent.type, 'for guide:', customEvent.detail?.guideId);
      if (customEvent.detail && customEvent.detail.guideId === guideId) {
        fetchRatingData();
      } else {
        console.log(`Event ignored - target guide: ${customEvent.detail?.guideId}, current guide: ${guideId}`);
      }
    };

    window.addEventListener('guideRatingUpdated', handleRatingUpdate);
    // initial fetch
    fetchRatingData();

    return () => window.removeEventListener('guideRatingUpdated', handleRatingUpdate);
  }, [guideId, fetchRatingData]);

  return {
    averageRating,
    reviewCount,
    ratingCounts,
    isLoading,
    refreshRating: fetchRatingData,
  };
};

export const triggerGuideRatingUpdate = (guideId: string) => {
  if (!guideId) return;
  const event = new CustomEvent('guideRatingUpdated', {
    detail: { guideId },
  });
  window.dispatchEvent(event);
};
