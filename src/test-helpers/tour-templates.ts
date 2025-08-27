// Test helpers for tour templates functionality
import { TourTemplate, TourTemplateData } from '../lib/types';

// Example system templates (as included in database migration)
export const exampleSystemTemplates: TourTemplate[] = [
  {
    id: 'template-svaneti-highlights',
    name: 'Svaneti Highlights',
    description: 'Classic multi-day Svaneti tour covering the main highlights',
    template_data: {
      title: 'Svaneti Highlights Tour',
      description: 'Discover the ancient towers and stunning landscapes of Svaneti, one of Georgia\'s most beautiful mountain regions.',
      duration: 8,
      price: 250,
      capacity: 6,
      languages: ['English', 'Georgian'],
      days_available: [true, true, true, true, true, true, true],
      is_private: false,
      locations: [
        { id: 'svaneti_1', name: 'Mestia', notes: 'Ancient tower houses and Svaneti Museum', order: 1 },
        { id: 'svaneti_2', name: 'Ushguli', notes: 'Highest permanently inhabited village in Europe', order: 2 },
        { id: 'svaneti_3', name: 'Lamaria Church', notes: '12th century church with unique frescoes', order: 3 }
      ]
    },
    is_system_template: true,
    creator_id: null,
    category: 'svaneti',
    is_active: true,
    usage_count: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'template-wine-tasting',
    name: 'Wine Tasting Experience',
    description: 'Discover Georgian wine-making traditions',
    template_data: {
      title: 'Georgian Wine Heritage',
      description: 'Experience the ancient Georgian winemaking tradition with tastings and vineyard visits.',
      duration: 5,
      price: 150,
      capacity: 8,
      languages: ['English', 'Georgian'],
      days_available: [false, true, true, true, true, true, false],
      is_private: false,
      locations: [
        { id: 'wine_1', name: 'Traditional Winery', notes: 'Qvevri winemaking demonstration', order: 1 },
        { id: 'wine_2', name: 'Vineyard Tour', notes: 'Grape varieties and harvesting techniques', order: 2 }
      ]
    },
    is_system_template: true,
    creator_id: null,
    category: 'wine',
    is_active: true,
    usage_count: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

// Test cases for template functionality
export const templateTestCases = [
  {
    name: "Template selection pre-fills form",
    description: "Selecting a template should populate all form fields",
    template: exampleSystemTemplates[0],
    expected: {
      titlePrefilled: true,
      descriptionPrefilled: true,
      locationsPrefilled: true,
      pricePrefilled: true,
      durationPrefilled: true,
      languagesPrefilled: true,
      fullyEditable: true
    }
  },
  {
    name: "Template remains fully editable",
    description: "After using template, all fields should be editable before save",
    steps: [
      "Select Svaneti Highlights template",
      "Modify title, price, locations",
      "Verify changes are preserved",
      "Save tour with modifications"
    ]
  },
  {
    name: "Save custom template",
    description: "User can save their tour configuration as a custom template",
    tourData: {
      title: "My Custom Tour",
      description: "A unique tour experience",
      duration: 4,
      price: 100,
      capacity: 4,
      languages: ["English"],
      days_available: [true, true, false, false, false, false, false],
      is_private: true,
      locations: [
        { id: "custom_1", name: "Custom Location", notes: "Special place", order: 1 }
      ]
    },
    expected: {
      templateSaved: true,
      appearsInUserTemplates: true,
      canBeReused: true
    }
  },
  {
    name: "Template categories",
    description: "Templates should be organized by categories",
    categories: ['svaneti', 'cultural', 'wine', 'adventure', 'general'],
    expected: {
      filteringWorks: true,
      categoryDisplayed: true,
      systemTemplatesIncluded: true
    }
  }
];

// Mock template data for testing
export const createMockTemplate = (overrides: Partial<TourTemplate> = {}): TourTemplate => ({
  id: 'mock-template-id',
  name: 'Mock Template',
  description: 'A template for testing',
  template_data: {
    title: 'Mock Tour',
    description: 'Test tour description',
    duration: 4,
    price: 100,
    capacity: 6,
    languages: ['English'],
    days_available: [true, true, true, true, true, false, false],
    is_private: false,
    locations: [
      { id: 'mock_1', name: 'Test Location', notes: 'Test notes', order: 1 }
    ]
  },
  is_system_template: false,
  creator_id: 'test-user-id',
  category: 'general',
  is_active: true,
  usage_count: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

// Template form validation test cases
export const templateValidationTests = [
  {
    name: "Required fields validation",
    input: { name: '', description: '' },
    expected: { isValid: false, errors: ['name', 'description'] }
  },
  {
    name: "Minimum length validation",
    input: { name: 'A', description: 'Short' },
    expected: { isValid: false, errors: ['name', 'description'] }
  },
  {
    name: "Valid template data",
    input: { name: 'Great Template', description: 'This is a comprehensive template for tours' },
    expected: { isValid: true, errors: [] }
  }
];

// UI integration test scenarios
export const templateUIScenarios = [
  {
    name: "Template picker during tour creation",
    steps: [
      "Start creating new tour",
      "Template picker should appear first",
      "Can browse by category",
      "Can preview template details",
      "Can confirm selection or skip to blank form"
    ]
  },
  {
    name: "Save as template during tour editing",
    steps: [
      "Edit existing tour or create new one",
      "Fill out form completely",
      "Click 'Save as Template' button",
      "Enter template name and description",
      "Select category",
      "Confirm save",
      "Template appears in user templates"
    ]
  },
  {
    name: "Template management",
    steps: [
      "View user templates",
      "Edit template details",
      "Delete unused templates",
      "View usage statistics"
    ]
  }
];

// Database schema test
export const templateSchemaTest = {
  tableName: 'tour_templates',
  requiredColumns: [
    'id', 'name', 'description', 'template_data',
    'is_system_template', 'creator_id', 'category',
    'is_active', 'usage_count', 'created_at', 'updated_at'
  ],
  indexes: [
    'idx_tour_templates_creator_id',
    'idx_tour_templates_category', 
    'idx_tour_templates_is_system',
    'idx_tour_templates_usage_count'
  ],
  policies: [
    'Anyone can view active system templates',
    'Users can create their own templates',
    'Users can update their own templates',
    'Users can delete their own templates'
  ]
};

// Template data structure validation
export const validateTemplateData = (data: TourTemplateData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.title || data.title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  if (!data.description || data.description.trim().length === 0) {
    errors.push('Description is required');
  }
  
  if (!data.duration || data.duration <= 0) {
    errors.push('Duration must be greater than 0');
  }
  
  if (!data.price || data.price < 0) {
    errors.push('Price must be non-negative');
  }
  
  if (!data.capacity || data.capacity <= 0) {
    errors.push('Capacity must be greater than 0');
  }
  
  if (!data.languages || data.languages.length === 0) {
    errors.push('At least one language is required');
  }
  
  if (!data.locations || data.locations.length === 0) {
    errors.push('At least one location is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};