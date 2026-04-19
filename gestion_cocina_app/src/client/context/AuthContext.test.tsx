import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth, AuthProvider } from './AuthContext';
import { ReactNode } from 'react';

vi.mock('../services/AuthService', () => ({
  AuthService: {
    me: vi.fn().mockResolvedValue(null),
    login: vi.fn()
  }
}));

import { AuthService } from '../services/AuthService';

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should provide initial null user', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
  });

  it('should login successfully', async () => {
    (AuthService.login as ReturnType<typeof vi.fn>).mockResolvedValue({ 
      id: 1, 
      name: 'Test User', 
      email: 'test@test.com',
      token: 'fake-token' 
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login({ email: 'test@test.com', password: 'password123' });
    });

    await waitFor(() => {
      expect(result.current.user).not.toBeNull();
    });
  });
});