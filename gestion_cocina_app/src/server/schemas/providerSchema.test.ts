import { describe, it, expect } from 'vitest';
import { ProviderSchema } from '../schemas/providerSchema';

describe('ProviderSchema', () => {
  it('should validate a valid provider', () => {
    const validProvider = {
      name: 'Proveedor Test',
      cuit: '20-12345678-9',
      address: 'Calle Falsa 123'
    };
    const result = ProviderSchema.safeParse(validProvider);
    expect(result.success).toBe(true);
  });

  it('should validate provider without optional fields', () => {
    const provider = { name: 'Proveedor Minimo' };
    const result = ProviderSchema.safeParse(provider);
    expect(result.success).toBe(true);
  });

  it('should reject provider with name too short', () => {
    const provider = { name: 'AB' };
    const result = ProviderSchema.safeParse(provider);
    expect(result.success).toBe(false);
  });

  it('should reject provider with invalid CUIT format', () => {
    const provider = { name: 'Proveedor Test', cuit: 'invalid-cuit' };
    const result = ProviderSchema.safeParse(provider);
    expect(result.success).toBe(false);
  });

  it('should accept empty string as optional fields', () => {
    const provider = { name: 'Proveedor Test', cuit: '', address: '' };
    const result = ProviderSchema.safeParse(provider);
    expect(result.success).toBe(true);
  });
});