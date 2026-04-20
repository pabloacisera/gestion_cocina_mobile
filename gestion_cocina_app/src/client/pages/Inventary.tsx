import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/ApiService';
import { MEASURE_UNIT_LABELS } from '../../server/schemas/productSchema';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faCircleNotch, faBoxesStacked, faChevronLeft, faChevronRight, faSearch, faFilter } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { BackButton } from '../components/shared/BackButton';
import '../../css/inventory.css';

// Local product interface to avoid incorrect prisma client import
interface Product {
  id: number;
  providerId: number;
  name: string;
  description: string | null;
  measureUnit: string;
  quantity: number;
  minStock: number;
  purchaseUnit: string | null;
  conversionFactor: number;
}

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
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<'all' | 'critical'>('all'); // State for stock filter

  const fetchProducts = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      // TODO: Add support for server-side filtering for lowStock
      const response = await ApiService.get<{ success: boolean; data: ProductWithProvider[]; pagination: Pagination }>(`/api/products?page=${page}`);
      if (response.success) {
        setProducts(response.data);
        setPagination(response.pagination);
      } else {
        setError(response.error || 'Error al cargar los productos del inventario.');
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.');
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

  // Apply search and stock filter
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (stockFilter === 'critical') {
      const status = getStockStatus(p);
      return matchesSearch && (status === 'critical' || status === 'low');
    }
    return matchesSearch; // If stockFilter is 'all', only apply search filter
  });

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
        <div className="inventory-header-top">
          <BackButton />
          <h1>
            <FontAwesomeIcon icon={faBoxesStacked} />
            Inventario
          </h1>
        </div>
        <button
          onClick={() => setStockFilter(stockFilter === 'all' ? 'critical' : 'all')}
          className={`btn-toggle-filter${stockFilter === 'critical' ? ' active' : ''}`}
        >
          <FontAwesomeIcon icon={stockFilter === 'critical' ? faExclamationTriangle : faSearch} />
          {stockFilter === 'all' ? 'Stock Crítico' : 'Ver todos'}
        </button>
      </div> {/* Closing the inventory-header div */}

      <div className="search-container">
        <div className="search-wrapper">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar en inventario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="inventory-content">
        {filteredProducts.length === 0 ? (
          <div className="inventory-empty">
            <FontAwesomeIcon icon={faBoxesStacked} size="2x" />
            <p>
              {stockFilter === 'critical'
                ? 'No hay productos con stock crítico o bajo.'
                : searchTerm
                ? `No se encontraron resultados para "${searchTerm}".`
                : 'No hay productos en el inventario.'}
            </p>
          </div>
        ) : (
          <ul className="inventory-list">
            {filteredProducts.map((product) => {
              const status = getStockStatus(product);
              const hasConversion = product.conversionFactor && product.conversionFactor !== 1 && product.purchaseUnit;
              const purchaseEquiv = hasConversion
                ? (product.quantity / product.conversionFactor).toFixed(2)
                : null;

              return (
                <li key={product.id} className={`inventory-card card-${status || 'ok'}`}>
                  <div className="card-main">
                    <div className="card-name">{product.name}</div>
                    <div className="card-provider">{product.provider?.name || 'Sin proveedor'}</div>
                  </div>
                  <div className="card-stock">
                    <div className="card-quantity">
                      <span className="quantity-value">{product.quantity}</span>
                      <span className="quantity-unit">
                        {MEASURE_UNIT_LABELS[product.measureUnit] || product.measureUnit}
                      </span>
                    </div>
                    {hasConversion && (
                      <div className="card-purchase-equiv">
                        ≈ {purchaseEquiv} {product.purchaseUnit}
                      </div>
                    )}
                    <div className="card-min">
                      mín: {product.minStock} {MEASURE_UNIT_LABELS[product.measureUnit] || product.measureUnit}
                    </div>
                    <span className={`status-badge badge-${status || 'ok'}`}>
                      {status === 'critical' ? '⚠ CRÍTICO' : status === 'low' ? '↓ BAJO' : '✓ OK'}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button onClick={handlePrevPage} disabled={pagination.page === 1} className="btn-pagination">
              <FontAwesomeIcon icon={faChevronLeft} /> Anterior
            </button>
            <span className="page-info">
              Página {pagination.page} de {pagination.totalPages} ({pagination.total} total)
            </span>
            <button onClick={handleNextPage} disabled={pagination.page === pagination.totalPages} className="btn-pagination">
              Siguiente <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
