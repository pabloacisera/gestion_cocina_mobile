import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NewProvider } from './NewProvider';
import { AuthProvider } from '../../context/AuthContext';

vi.mock('../../hooks/userAuth', () => ({
  userAuth: () => ({
    user: { id: 1, name: 'Test User' }
  })
}));

vi.mock('../../services/ApiService', () => ({
  ApiService: {
    post: vi.fn()
  }
}));

describe('NewProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the form', () => {
    render(
      <AuthProvider>
        <NewProvider />
      </AuthProvider>
    );

    expect(screen.getByLabelText(/Nombre o empresa/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/CUIT/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Dirección/)).toBeInTheDocument();
  });

  it('should have a submit button', () => {
    render(
      <AuthProvider>
        <NewProvider />
      </AuthProvider>
    );

    expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
  });
});