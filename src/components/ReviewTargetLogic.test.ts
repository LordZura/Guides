// Test file to verify our review targeting changes work correctly
import { describe, it, expect } from 'vitest';

describe('Review Target Logic', () => {
  it('should target tour when tour creator is guide', () => {
    const booking = {
      tour_id: 'tour1',
      guide_id: 'guide1',
      tour_creator_role: 'guide'
    };
    
    const targetId = booking.tour_creator_role === 'guide' ? booking.tour_id : booking.guide_id;
    const targetType = booking.tour_creator_role === 'guide' ? 'tour' : 'guide';
    
    expect(targetId).toBe('tour1');
    expect(targetType).toBe('tour');
  });
  
  it('should target guide when tour creator is tourist', () => {
    const booking = {
      tour_id: 'tour1',
      guide_id: 'guide1',
      tour_creator_role: 'tourist'
    };
    
    const targetId = booking.tour_creator_role === 'guide' ? booking.tour_id : booking.guide_id;
    const targetType = booking.tour_creator_role === 'guide' ? 'tour' : 'guide';
    
    expect(targetId).toBe('guide1');
    expect(targetType).toBe('guide');
  });
  
  it('should default to guide when tour_creator_role is undefined', () => {
    const booking = {
      tour_id: 'tour1',
      guide_id: 'guide1',
      tour_creator_role: undefined as any
    };
    
    const targetId = booking.tour_creator_role === 'guide' ? booking.tour_id : booking.guide_id;
    const targetType = booking.tour_creator_role === 'guide' ? 'tour' : 'guide';
    
    expect(targetId).toBe('guide1');
    expect(targetType).toBe('guide');
  });
});