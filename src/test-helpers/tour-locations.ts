// Test helpers for tour locations functionality
import { TourLocation } from '../lib/types';
import { 
  createTourLocation, 
  migrateSingleLocationToArray, 
  getPrimaryLocation,
  validateLocations,
  getLocationsDisplayString,
  exampleTourWithLocations
} from '../utils/tourLocations';

// Example tour with multiple locations (as requested in requirements)
export const exampleMultiLocationTour = {
  "id": "tour-svaneti-123",
  "title": "Svaneti Highlights",
  "description": "Experience the stunning mountain villages of Svaneti",
  "location": "Mestia", // Backward compatibility - primary location
  "locations": [
    { "id": "loc1", "name": "Mestia", "notes": "Start point - ancient towers", "order": 1 },
    { "id": "loc2", "name": "Ushguli", "notes": "Village walk - highest settlement", "order": 2 },
    { "id": "loc3", "name": "Lamaria Church", "notes": "Historic church with frescoes", "order": 3 }
  ],
  "duration": 8,
  "price": 250,
  "capacity": 6,
  "languages": ["English", "Georgian"],
  "is_private": false,
  "created_at": "2024-01-15T10:00:00Z"
};

// Test cases for tour locations functionality
export const tourLocationTestCases = [
  {
    name: "Single location tour (backward compatibility)",
    tour: {
      location: "Tbilisi",
      locations: null
    },
    expected: {
      displayString: "Tbilisi",
      primaryLocation: "Tbilisi",
      isMultiLocation: false
    }
  },
  {
    name: "Multiple location tour",
    tour: {
      location: "Mestia",
      locations: [
        { id: "1", name: "Mestia", notes: "Start", order: 1 },
        { id: "2", name: "Ushguli", notes: "End", order: 2 }
      ]
    },
    expected: {
      displayString: "Mestia → Ushguli", 
      primaryLocation: "Mestia",
      isMultiLocation: true
    }
  },
  {
    name: "Long route with many stops",
    tour: {
      locations: [
        { id: "1", name: "Mestia", order: 1 },
        { id: "2", name: "Ushguli", order: 2 },
        { id: "3", name: "Lamaria", order: 3 },
        { id: "4", name: "Chaladi", order: 4 }
      ]
    },
    expected: {
      displayString: "Mestia + 3 more stops",
      primaryLocation: "Mestia",
      isMultiLocation: true
    }
  }
];

// Migration test cases
export const migrationTestCases = [
  {
    name: "Migrate single location to array",
    input: "Batumi Old Town",
    expected: [
      {
        name: "Batumi Old Town",
        notes: "Migrated from single location", 
        order: 1
      }
    ]
  },
  {
    name: "Empty location handling",
    input: "",
    expected: []
  }
];

// Validation test cases 
export const validationTestCases = [
  {
    name: "Valid locations array",
    locations: [
      { id: "1", name: "Location 1", order: 1 },
      { id: "2", name: "Location 2", order: 2 }
    ],
    expected: { isValid: true, errors: [] }
  },
  {
    name: "Empty locations array",
    locations: [],
    expected: { isValid: false, errors: ["At least one location is required"] }
  },
  {
    name: "Duplicate location names",
    locations: [
      { id: "1", name: "Same Location", order: 1 },
      { id: "2", name: "Same Location", order: 2 }
    ],
    expected: { isValid: false, errors: ["Location names must be unique"] }
  },
  {
    name: "Duplicate orders",
    locations: [
      { id: "1", name: "Location 1", order: 1 },
      { id: "2", name: "Location 2", order: 1 }
    ],
    expected: { isValid: false, errors: ["Location orders must be unique"] }
  },
  {
    name: "Empty location name",
    locations: [
      { id: "1", name: "", order: 1 }
    ],
    expected: { isValid: false, errors: ["All locations must have names"] }
  }
];

// UI component test scenarios
export const uiTestScenarios = [
  {
    name: "Tour creation with multiple locations",
    description: "User can add/remove/reorder locations during tour creation",
    steps: [
      "Click 'Add Location' button",
      "Enter location name and notes", 
      "Add second location",
      "Reorder locations using drag handles",
      "Remove a location",
      "Verify route preview updates"
    ]
  },
  {
    name: "Tour detail display",
    description: "Tour details show proper location information",
    steps: [
      "Navigate to multi-location tour",
      "Verify route badge shows 'Location 1 → Location 2'",
      "Verify detailed itinerary section appears",
      "Verify ordered stops are displayed with numbers",
      "Verify backward compatibility with single location tours"
    ]
  },
  {
    name: "Migration handling", 
    description: "Existing single-location tours work correctly",
    steps: [
      "Load tour with only 'location' field populated",
      "Verify location displays correctly", 
      "Verify no itinerary section shown",
      "Verify edit form can upgrade to multiple locations"
    ]
  }
];

// Database migration verification
export const migrationVerification = {
  description: "Verify database migration completed successfully",
  checks: [
    "tours table has 'locations' JSONB column",
    "Existing tours migrated to locations array format",
    "Single location tours have locations[0].name = original location",
    "GIN index created on locations column",
    "Backward compatibility maintained"
  ],
  exampleQuery: `
    SELECT id, title, location, locations 
    FROM tours 
    WHERE locations IS NOT NULL 
    LIMIT 5;
  `
};

// Export the complete example as requested in requirements
export { exampleTourWithLocations };