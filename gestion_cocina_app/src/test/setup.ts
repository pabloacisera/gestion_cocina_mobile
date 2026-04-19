import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

global.fetch = vi.fn();

vi.mock('../client/services/AuthService', () => ({
  AuthService: {
    me: vi.fn().mockResolvedValue(null)
  }
}));