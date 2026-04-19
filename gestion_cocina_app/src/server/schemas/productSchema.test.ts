import { describe, it, expect } from 'vitest';
import { ProductSchema } from '../schemas/productSchema';

describe('ProductSchema', () => {
  it('should validate a valid product', () => {
    const validProduct = {
      providerId: 1,
      name: 'Harina',
      description: 'Harina de trigo 000',
      quantity: 10,
      measureUnit: 'KG',
      minStock: 5
    };
    const result = ProductSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it('should validate product without optional description', () => {
    const product = {
      providerId: 1,
      name: 'Azúcar',
      quantity: 5,
      measureUnit: 'KG'
    };
    const result = ProductSchema.safeParse(product);
    expect(result.success).toBe(true);
  });

  it('should reject product with negative quantity', () => {
    const product = {
      providerId: 1,
      name: 'Producto',
      quantity: -1,
      measureUnit: 'KG'
    };
    const result = ProductSchema.safeParse(product);
    expect(result.success).toBe(false);
  });

  it('should reject product without providerId', () => {
    const product = {
      name: 'Producto',
      quantity: 5,
      measureUnit: 'KG'
    };
    const result = ProductSchema.safeParse(product);
    expect(result.success).toBe(false);
  });

  it('should reject product with invalid providerId', () => {
    const product = {
      providerId: -1,
      name: 'Producto',
      quantity: 5,
      measureUnit: 'KG'
    };
    const result = ProductSchema.safeParse(product);
    expect(result.success).toBe(false);
  });

  it('should default minStock to 0 if not provided', () => {
    const product = {
      providerId: 1,
      name: 'Producto',
      quantity: 5,
      measureUnit: 'KG'
    };
    const result = ProductSchema.safeParse(product);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.minStock).toBe(0);
    }
  });

  it('should use default measureUnit KG if not provided', () => {
    const product = {
      providerId: 1,
      name: 'Producto',
      quantity: 5
    };
    const result = ProductSchema.safeParse(product);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.measureUnit).toBe('KG');
    }
  });
});
