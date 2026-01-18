import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { addEndpoint, removeEndpoint, endpoints, localStorageEndpoints } from './endpointsStore';
import { localEndpoints } from '$lib/stores/testData/testEndpoints';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
});

describe('endpointsStore', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorageEndpoints.set([]);
  });

  it('should contain local endpoints by default', () => {
    const currentEndpoints = get(endpoints);
    // There are many local endpoints, so length should be at least that.
    expect(currentEndpoints.length).toBeGreaterThanOrEqual(localEndpoints.length);

    // Check for a known local endpoint
    const nhost = currentEndpoints.find(e => e.id === 'nhost');
    expect(nhost).toBeDefined();
    expect(nhost?.url).toContain('nhost');
  });

  it('should add a user endpoint', () => {
    const newEndpoint = {
      id: 'test-endpoint',
      url: 'https://test.com/graphql',
      description: 'Test Endpoint',
      isMantained: false
    };

    addEndpoint(newEndpoint);

    const currentEndpoints = get(endpoints);
    const added = currentEndpoints.find(e => e.id === 'test-endpoint');
    expect(added).toBeDefined();
    expect(added?.id).toBe(newEndpoint.id);
    expect(added?.url).toBe(newEndpoint.url);
  });

  it('should remove a user endpoint', () => {
     const newEndpoint = {
      id: 'test-endpoint-remove',
      url: 'https://test.com/graphql',
      description: 'Test Endpoint',
      isMantained: false
    };

    addEndpoint(newEndpoint);
    expect(get(endpoints).find(e => e.id === 'test-endpoint-remove')).toBeDefined();

    removeEndpoint('test-endpoint-remove');
    expect(get(endpoints).find(e => e.id === 'test-endpoint-remove')).toBeUndefined();
  });

  it('local endpoint should take precedence over user endpoint with same ID', () => {
      const builtInId = 'nhost';
      const originalNhost = localEndpoints.find(e => e.id === builtInId);

      const fakeNhost = {
          id: builtInId,
          url: 'https://fake.com',
          description: 'Fake',
          isMantained: false
      };

      // Add fake nhost to storage
      addEndpoint(fakeNhost);

      // Verify storage has it
      const storage = get(localStorageEndpoints);
      expect(storage.find(e => e.id === builtInId)).toEqual(fakeNhost);

      // Verify derived store has the ORIGINAL one
      const merged = get(endpoints);
      const visibleNhost = merged.find(e => e.id === builtInId);

      expect(visibleNhost?.url).toBe(originalNhost?.url);
      expect(visibleNhost?.url).not.toBe(fakeNhost.url);
  });
});
