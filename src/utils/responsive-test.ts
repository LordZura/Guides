/**
 * Responsive Testing Utilities
 * Helper functions to test responsive behavior across different viewport sizes
 */

export const MOBILE_VIEWPORTS = {
  small_android: { width: 360, height: 800, name: 'Small Android' },
  iphone_x: { width: 375, height: 812, name: 'iPhone X/11/12/13' },
  iphone_pro: { width: 390, height: 844, name: 'iPhone 12/13 Pro' },
  large_android: { width: 412, height: 915, name: 'Large Android' },
  ipad_portrait: { width: 768, height: 1024, name: 'iPad Portrait' },
  ipad_pro: { width: 1024, height: 1366, name: 'iPad Pro' },
};

export type ViewportSize = keyof typeof MOBILE_VIEWPORTS;

/**
 * Check if an element is within the viewport bounds
 */
export function isElementInViewport(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Check if an element causes horizontal overflow
 */
export function checkHorizontalOverflow(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  return rect.width > window.innerWidth;
}

/**
 * Get all elements that overflow horizontally
 */
export function findOverflowingElements(): Element[] {
  const allElements = document.querySelectorAll('*');
  const overflowing: Element[] = [];
  
  allElements.forEach(el => {
    if (checkHorizontalOverflow(el)) {
      overflowing.push(el);
    }
  });
  
  return overflowing;
}

/**
 * Check if touch targets meet minimum size requirements (44-48px)
 */
export function validateTouchTarget(el: Element, minSize: number = 44): boolean {
  const rect = el.getBoundingClientRect();
  return rect.width >= minSize && rect.height >= minSize;
}

/**
 * Find all interactive elements with insufficient touch targets
 */
export function findSmallTouchTargets(minSize: number = 44): Element[] {
  const selectors = [
    'button',
    'a',
    'input[type="button"]',
    'input[type="submit"]',
    '[role="button"]',
    '[onclick]',
  ];
  
  const interactive = document.querySelectorAll(selectors.join(','));
  const small: Element[] = [];
  
  interactive.forEach(el => {
    if (!validateTouchTarget(el, minSize)) {
      small.push(el);
    }
  });
  
  return small;
}

/**
 * Check if text is readable (font size >= 16px to prevent iOS zoom)
 */
export function checkTextReadability(el: Element): boolean {
  const computed = window.getComputedStyle(el);
  const fontSize = parseFloat(computed.fontSize);
  return fontSize >= 16;
}

/**
 * Run comprehensive responsive diagnostics
 */
export function runResponsiveDiagnostics() {
  const results = {
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    horizontalOverflow: findOverflowingElements(),
    smallTouchTargets: findSmallTouchTargets(),
    viewportMeta: document.querySelector('meta[name="viewport"]')?.getAttribute('content'),
  };
  
  console.group('📱 Responsive Diagnostics');
  console.log('Viewport:', results.viewport);
  console.log('Viewport Meta:', results.viewportMeta);
  console.log('Horizontal Overflow Elements:', results.horizontalOverflow.length);
  console.log('Small Touch Targets:', results.smallTouchTargets.length);
  
  if (results.horizontalOverflow.length > 0) {
    console.warn('⚠️ Elements causing horizontal overflow:', results.horizontalOverflow);
  }
  
  if (results.smallTouchTargets.length > 0) {
    console.warn('⚠️ Touch targets below 44px:', results.smallTouchTargets);
  }
  
  console.groupEnd();
  
  return results;
}

/**
 * Simulate viewport resize for testing
 */
export function simulateViewport(viewportKey: ViewportSize) {
  const viewport = MOBILE_VIEWPORTS[viewportKey];
  console.log(`📱 Simulating ${viewport.name} (${viewport.width}×${viewport.height})`);
  
  // Note: This is for logging only. Actual viewport testing requires browser dev tools or automation.
  return viewport;
}

// Make available in browser console for manual testing
if (typeof window !== 'undefined') {
  (window as any).responsiveTest = {
    runDiagnostics: runResponsiveDiagnostics,
    findOverflow: findOverflowingElements,
    findSmallTargets: findSmallTouchTargets,
    simulate: simulateViewport,
    viewports: MOBILE_VIEWPORTS,
  };
}
