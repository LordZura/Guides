// Test helpers for searchable language selector functionality
import { LanguageOption } from '../components/SearchableLanguageSelector';

// Test language options
export const testLanguageOptions: LanguageOption[] = [
  { value: 'english', label: 'English', code: 'en' },
  { value: 'spanish', label: 'Spanish', code: 'es' },
  { value: 'french', label: 'French', code: 'fr' },
  { value: 'georgian', label: 'Georgian', code: 'ka' },
  { value: 'russian', label: 'Russian', code: 'ru' }
];

// Language selector test cases
export const languageSelectorTestCases = [
  {
    name: "Single language selection",
    action: "select",
    language: "English",
    expected: {
      selectedLanguages: ["English"],
      persistsAfterReload: true
    }
  },
  {
    name: "Multiple language selection", 
    action: "select_multiple",
    languages: ["English", "Georgian", "Spanish"],
    expected: {
      selectedLanguages: ["English", "Georgian", "Spanish"],
      displayedAsTags: true,
      persistsAfterReload: true
    }
  },
  {
    name: "Language search functionality",
    action: "search",
    searchTerm: "geo",
    expected: {
      filteredResults: ["Georgian"],
      searchWorks: true
    }
  },
  {
    name: "Language removal",
    action: "remove",
    initialLanguages: ["English", "Spanish", "Georgian"],
    removeLanguage: "Spanish",
    expected: {
      selectedLanguages: ["English", "Georgian"],
      persistsAfterReload: true
    }
  },
  {
    name: "Clear all languages",
    action: "clear_all",
    initialLanguages: ["English", "Spanish"],
    expected: {
      selectedLanguages: [],
      persistsAfterReload: true
    }
  }
];

// Search functionality tests
export const searchTestCases = [
  {
    searchTerm: "en",
    expectedMatches: ["English"],
    description: "Search by partial name"
  },
  {
    searchTerm: "ka",
    expectedMatches: ["Georgian"],
    description: "Search by language code"
  },
  {
    searchTerm: "span",
    expectedMatches: ["Spanish"],
    description: "Search by partial name (case insensitive)"
  },
  {
    searchTerm: "xyz",
    expectedMatches: [],
    description: "No matches for invalid search"
  }
];

// Validation test cases
export const validationTestCases = [
  {
    name: "Required field validation",
    selectedLanguages: [],
    isRequired: true,
    expected: {
      isValid: false,
      errorMessage: "At least one language is required"
    }
  },
  {
    name: "Optional field validation",
    selectedLanguages: [],
    isRequired: false,
    expected: {
      isValid: true,
      errorMessage: null
    }
  },
  {
    name: "Valid selection",
    selectedLanguages: ["English", "Georgian"],
    isRequired: true,
    expected: {
      isValid: true,
      errorMessage: null
    }
  }
];

// Data persistence test scenarios
export const persistenceTestCases = [
  {
    name: "Profile language persistence",
    description: "Languages selected in profile should persist across sessions",
    scenario: {
      initialLanguages: [],
      selectLanguages: ["English", "Georgian", "Spanish"],
      saveProfile: true,
      reloadPage: true,
      expectedLanguages: ["English", "Georgian", "Spanish"]
    }
  },
  {
    name: "Tour creation language persistence",
    description: "Languages selected during tour creation should be saved with tour",
    scenario: {
      createTour: true,
      selectLanguages: ["English", "French"],
      saveTour: true,
      viewTourDetails: true,
      expectedLanguages: ["English", "French"]
    }
  }
];

// UI component test scenarios
export const uiTestScenarios = [
  {
    name: "Searchable dropdown behavior",
    steps: [
      "Click on language selector",
      "Dropdown should open with all languages",
      "Type search term",
      "List should filter to matching languages",
      "Click on a language to select",
      "Selected language appears as tag",
      "Can select multiple languages",
      "Can remove individual languages",
      "Can clear all selections"
    ]
  },
  {
    name: "Responsive design",
    steps: [
      "Test on mobile screen",
      "Dropdown should be touch-friendly",
      "Tags should wrap properly",
      "Search should work with virtual keyboard"
    ]
  },
  {
    name: "Accessibility features", 
    steps: [
      "Navigate with keyboard only",
      "Tab to focus selector",
      "Arrow keys to navigate options",
      "Enter to select/deselect",
      "Escape to close dropdown",
      "Screen reader announces selections"
    ]
  }
];

// Data shape validation
export const dataShapeTest = {
  description: "Ensure language data is stored in deterministic format",
  validFormats: [
    {
      format: "array_of_names",
      example: ["English", "Georgian", "Spanish"],
      description: "Array of language names (current implementation)"
    },
    {
      format: "array_of_codes", 
      example: ["en", "ka", "es"],
      description: "Array of language codes (alternative)"
    }
  ],
  recommendation: "Use array of language names for user-friendly display"
};

// Integration test with profile and tour forms
export const integrationTests = [
  {
    name: "Profile editor integration",
    component: "ProfileEditor",
    expectedBehavior: {
      replacesOldSelector: true,
      persistsToDatabase: true,
      displaysOnProfile: true,
      displaysOnPublicGuide: true
    }
  },
  {
    name: "Tour creation integration",
    component: "TourForm", 
    expectedBehavior: {
      allowsMultipleSelection: true,
      validatesRequired: true,
      savesToTourData: true,
      displaysInTourDetails: true
    }
  },
  {
    name: "Tour template integration",
    component: "TourTemplatePicker",
    expectedBehavior: {
      prefillsFromTemplate: true,
      allowsModification: true,
      savesWithTemplate: true
    }
  }
];

// Performance test cases
export const performanceTests = [
  {
    name: "Large language list performance",
    setup: "50+ languages in dropdown",
    expected: {
      searchResponsive: true,
      scrollingSmooth: true,
      selectionFast: true
    }
  },
  {
    name: "Multiple selection performance", 
    setup: "10+ languages selected",
    expected: {
      tagsRenderFast: true,
      removalResponsive: true,
      persistenceQuick: true
    }
  }
];

// Mock data helpers
export const createMockLanguageData = (languages: string[]) => ({
  selectedLanguages: languages,
  onChange: (_newLanguages: string[]) => {
    // Development logging removed for production build
  },
  isRequired: false,
  isInvalid: false
});

// Validation helper
export const validateLanguageSelection = (
  languages: string[], 
  isRequired: boolean = false
): { isValid: boolean; errorMessage?: string } => {
  if (isRequired && languages.length === 0) {
    return {
      isValid: false,
      errorMessage: "At least one language is required"
    };
  }
  
  return { isValid: true };
};