# Responsive Testing Guide

## Quick Testing Steps

### 1. Visual Testing
Visit the responsive test page at `/responsive-test` after starting the app.

### 2. Browser DevTools Testing
1. Open Chrome/Edge DevTools (F12)
2. Click the device toolbar icon (Ctrl+Shift+M)
3. Test these preset devices:
   - iPhone SE (375×667)
   - iPhone 12 Pro (390×844)
   - Pixel 5 (393×851)
   - iPad Air (820×1180)

### 3. Manual Viewport Testing
In DevTools, set custom dimensions:
- 360×800 (Small Android)
- 375×812 (iPhone X/11/12/13)
- 412×915 (Large Android)
- 768×1024 (iPad Portrait)

### 4. Console Diagnostics
Open browser console and run:
```javascript
// Full diagnostic
window.responsiveTest.runDiagnostics()

// Check for overflow
window.responsiveTest.findOverflow()

// Check touch targets
window.responsiveTest.findSmallTargets()
```

## Testing Checklist

### Navigation ✅
- [ ] Hamburger menu opens on mobile
- [ ] Menu closes after clicking a link
- [ ] All nav items are tappable (48px)
- [ ] Logo is visible and clickable

### Pages ✅
- [ ] Explore page hero scales properly
- [ ] Filter drawer opens full-screen
- [ ] Dashboard grid stacks on mobile
- [ ] Tour details modal is full-screen
- [ ] Profile page looks good

### Forms ✅
- [ ] All inputs are at least 44px high
- [ ] Buttons are at least 48px
- [ ] Forms are easy to fill on mobile
- [ ] Auth modal is full-screen on mobile
- [ ] No zoom on input focus (16px font)

### Layout ✅
- [ ] No horizontal scrolling
- [ ] Cards stack properly
- [ ] Images scale correctly
- [ ] Text is readable
- [ ] Proper spacing

### Images ✅
- [ ] Avatar images load
- [ ] Fallback shows if image fails
- [ ] Images don't overflow
- [ ] Proper aspect ratios

## Common Issues & Fixes

### Issue: Horizontal Scrolling
**Fix**: Check for fixed-width elements or padding that exceeds viewport
```javascript
window.responsiveTest.findOverflow()
```

### Issue: Small Touch Targets
**Fix**: Ensure all buttons/links have minH="44px" or minH="48px"
```javascript
window.responsiveTest.findSmallTargets()
```

### Issue: Text Too Small on iOS
**Fix**: Ensure base font-size is at least 16px (prevents auto-zoom)

### Issue: Modal Not Full-Screen
**Fix**: Use size={{ base: "full", sm: "md" }} on Modal component

## Expected Results

### Mobile (360-414px)
- Single column layout
- Full-screen modals/drawers
- Stacked form fields
- Full-width buttons
- Touch-friendly spacing

### Tablet (768-991px)
- Two column layout
- Sidebar visible
- Larger touch targets
- Better spacing

### Desktop (992px+)
- Multi-column layouts
- All features visible
- Hover effects work
- Optimal spacing

## Lighthouse Testing

Run Lighthouse Mobile audit:
1. Open DevTools
2. Go to Lighthouse tab
3. Select "Mobile" device
4. Run audit

Target scores:
- Performance: ≥ 90
- Accessibility: ≥ 90
- Best Practices: ≥ 90
- SEO: ≥ 90

## Automated Testing

### Visual Regression (Future)
Could add Playwright or Cypress for automated screenshot comparison:
```javascript
// Example test
test('mobile homepage', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await expect(page).toHaveScreenshot();
});
```

## Browser Testing

Test on actual devices when possible:
- iOS Safari (iPhone)
- Chrome (Android)
- Samsung Internet (Android)
- Firefox (Mobile)

## Accessibility Testing

- Test with VoiceOver (iOS)
- Test with TalkBack (Android)
- Test keyboard navigation
- Check color contrast
- Verify ARIA labels

## Documentation

- MOBILE_RESPONSIVENESS_IMPLEMENTATION.md - Full implementation guide
- MOBILE_RESPONSIVENESS_AUDIT.md - Original audit findings
- MOBILE_RESPONSIVENESS_README.md - Quick reference

## Need Help?

Check the console utilities:
```javascript
// Available utilities
window.responsiveTest.viewports  // List test viewports
window.responsiveTest.simulate({ width: 375, height: 812 })
```

---

Happy Testing! 🎉
