import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/ApiService';
import { Product } from '../../../prisma/client';
import { MEASURE_UNIT_LABELS } from '../../server/schemas/productSchema';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faCircleNotch, faBoxesStacked, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { BackButton } from '../components/shared/BackButton';
import '../../css/inventory.css';

// Define a more specific type for the product with provider details
interface ProductWithProvider extends Product {
  provider: {
    id: number;
    name: string;
    cuit?: string | null;
    address?: string | null;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function Inventary() {
  const [products, setProducts] = useState<ProductWithProvider[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });

  const fetchProducts = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await ApiService.get<{ success: boolean; data: ProductWithProvider[]; pagination: Pagination }>(`/api/products?page=${page}`);
      if (response.success) {
        setProducts(response.data);
        setPagination(response.pagination);
      } else {
        setError(response.error || 'Failed to fetch products.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handlePrevPage = () => {
    if (pagination.page > 1) {
      fetchProducts(pagination.page - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      fetchProducts(pagination.page + 1);
    }
  };

  const getStockStatus = (product: ProductWithProvider) => {
    if (product.quantity === null || product.minStock === null) return ''; // Should not happen with default values

    const minStock = product.minStock ?? 0;
    const currentQuantity = product.quantity ?? 0;
    const criticalThreshold = minStock * 1.5;

    if (currentQuantity <= minStock) {
      return 'critical'; // Red badge
    } else if (currentQuantity <= criticalThreshold) {
      return 'low'; // Yellow badge
    }
    return ''; // No badge
  };

  const getBadgeColorClass = (status: string) => {
    switch (status) {
      case 'critical':
        return 'badge-critical'; // CSS class for red
      case 'low':
        return 'badge-low'; // CSS class for yellow
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="inventory-page">
        <div className="loading-indicator">
          <FontAwesomeIcon icon={faCircleNotch} spin size="lg" />
          Cargando...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="inventory-page">
        <div className="error-message">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BackButton />
          <h1><FontAwesomeIcon icon={faBoxesStacked} /> Inventario</h1>
        </div>
      </div>
      {products.length === 0 ? (
        <div className="inventory-empty">
          No hay productos en el inventario.
        </div>
      ) : (
        <ul className="product-list">
          {products.map((product) => {
            const status = getStockStatus(product);
            return (
              <li key={product.id} className={`product-item ${status ? getBadgeColorClass(status) : ''}`}>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="provider-name">
                    Proveedor: {product.provider ? product.provider.name : 'N/A'}
                  </p>
                  <p className="stock-min">Stock mín: {product.minStock ?? 0}</p>
                </div>
                <div className="stock-details">
                  <div className="stock-current">
                    <span className="quantity">{product.quantity ?? 0}</span>
                    <span className="unit">{MEASURE_UNIT_LABELS[(product as any).measureUnit as keyof typeof MEASURE_UNIT_LABELS] || (product as any).measureUnit}</span>
                  </div>
                  {status && (
                    <span className={`stock-badge ${getBadgeColorClass(status)}`}>
                      {status === 'critical' ? 'CRÍTICO' : 'BAJO'}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={handlePrevPage} 
            disabled={pagination.page === 1}
            className="btn-pagination"
          >
            <FontAwesomeIcon icon={faChevronLeft} /> Anterior
          </button>
          <span className="page-info">
            Página {pagination.page} de {pagination.totalPages} ({pagination.total} total)
          </span>
          <button 
            onClick={handleNextPage} 
            disabled={pagination.page === pagination.totalPages}
            className="btn-pagination"
          >
            Siguiente <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      )}
    </div>
  );
}
