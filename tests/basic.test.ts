import { describe, test, expect } from 'vitest';

describe('Basic Sanity Test', () => {
  test('basic arithmetic works', () => {
    expect(1 + 1).toBe(2);
  });

  test('arrays work', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr[0]).toBe(1);
  });

  test('objects work', () => {
    const obj = { name: 'test', value: 42 };
    expect(obj.name).toBe('test');
    expect(obj.value).toBe(42);
  });

  test('environment is available', () => {
    expect(process).toBeDefined();
    expect(process.env).toBeDefined();
  });
});