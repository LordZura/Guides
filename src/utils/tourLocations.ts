import { TourLocation } from '../lib/types';

/**
 * Utility functions for handling tour locations
 */

// Generate a unique ID for a location
export const generateLocationId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// Create a new tour location
export const createTourLocation = (name: string, notes?: string, order?: number): TourLocation => {
  return {
    id: generateLocationId(),
    name: name.trim(),
    notes: notes?.trim() || '',
    order: order || 1
  };
};

// Migrate a single location string to locations array
export const migrateSingleLocationToArray = (location: string): TourLocation[] => {
  if (!location || location.trim() === '') {
    return [];
  }
  
  return [createTourLocation(location, 'Migrated from single location', 1)];
};

// Get primary location (first in order) for backward compatibility
export const getPrimaryLocation = (locations?: TourLocation[]): string => {
  if (!locations || locations.length === 0) {
    return '';
  }
  
  // Sort by order and return the first one
  const sortedLocations = [...locations].sort((a, b) => a.order - b.order);
  return sortedLocations[0]?.name || '';
};

// Sort locations by order
export const sortLocationsByOrder = (locations: TourLocation[]): TourLocation[] => {
  return [...locations].sort((a, b) => a.order - b.order);
};

// Validate locations array
export const validateLocations = (locations: TourLocation[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!locations || locations.length === 0) {
    errors.push('At least one location is required');
    return { isValid: false, errors };
  }
  
  // Check for duplicate names
  const names = locations.map(loc => loc.name.toLowerCase().trim());
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
  if (duplicates.length > 0) {
    errors.push('Location names must be unique');
  }
  
  // Check for valid orders
  const orders = locations.map(loc => loc.order);
  if (new Set(orders).size !== orders.length) {
    errors.push('Location orders must be unique');
  }
  
  // Check for empty names
  const emptyNames = locations.some(loc => !loc.name || loc.name.trim() === '');
  if (emptyNames) {
    errors.push('All locations must have names');
  }
  
  return { isValid: errors.length === 0, errors };
};

// Get locations display string for UI
export const getLocationsDisplayString = (locations?: TourLocation[], maxLength: number = 50): string => {
  if (!locations || locations.length === 0) {
    return 'No locations specified';
  }
  
  const sortedLocations = sortLocationsByOrder(locations);
  const locationNames = sortedLocations.map(loc => loc.name);
  
  if (locationNames.length === 1) {
    return locationNames[0];
  }
  
  const joined = locationNames.join(' → ');
  
  if (joined.length <= maxLength) {
    return joined;
  }
  
  // If too long, show first location + count
  return `${locationNames[0]} + ${locationNames.length - 1} more stops`;
};

// Reorder locations
export const reorderLocations = (locations: TourLocation[], newOrder: string[]): TourLocation[] => {
  const locationMap = new Map(locations.map(loc => [loc.id, loc]));
  
  return newOrder.map((id, index) => {
    const location = locationMap.get(id);
    if (!location) {
      throw new Error(`Location with id ${id} not found`);
    }
    
    return {
      ...location,
      order: index + 1
    };
  });
};

// Example tour with locations (as requested in requirements)
export const exampleTourWithLocations = {
  "id": "tour-123",
  "title": "Svaneti Highlights",
  "locations": [
    { "id": "loc1", "name": "Mestia", "notes": "Start point", "order": 1 },
    { "id": "loc2", "name": "Ushguli", "notes": "Village walk", "order": 2 }
  ],
  // ... other tour fields
};