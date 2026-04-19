import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Inventary } from './Inventary';
import { AuthProvider } from '../context/AuthContext';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/ApiService', () => ({
  ApiService: {
    get: vi.fn()
  }
}));

vi.mock('../services/AuthService', () => ({
  AuthService: {
    me: vi.fn().mockResolvedValue(null)
  }
}));

const mockProducts = [
  {
    id: 1,
    name: 'Harina',
    quantity: 2,
    minStock: 5,
    measureUnit: 'KG',
    provider: { id: 1, name: 'Proveedor A' }
  },
  {
    id: 2,
    name: 'Azúcar',
    quantity: 10,
    minStock: 3,
    measureUnit: 'KG',
    provider: { id: 2, name: 'Proveedor B' }
  }
];

import { ApiService } from '../services/ApiService';

const mockApiService = ApiService as { get: ReturnType<typeof vi.fn> };

describe('Inventary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render products list', async () => {
    mockApiService.get.mockResolvedValue({ success: true, data: mockProducts, pagination: { page: 1, limit: 10, total: 2, totalPages: 1 } });
    
    render(
      <MemoryRouter>
        <AuthProvider>
          <Inventary />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Harina')).toBeInTheDocument();
      expect(screen.getByText('Azúcar')).toBeInTheDocument();
    });
  });

  it('should show critical stock badge for low stock products', async () => {
    mockApiService.get.mockResolvedValue({ success: true, data: mockProducts, pagination: { page: 1, limit: 10, total: 2, totalPages: 1 } });
    
    render(
      <MemoryRouter>
        <AuthProvider>
          <Inventary />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/CRÍTICO/i)).toBeInTheDocument();
    });
  });
});
