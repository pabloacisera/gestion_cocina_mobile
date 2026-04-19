import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faChevronLeft, faChevronRight, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';

import { ApiService } from '../services/ApiService';
import { BackButton } from '../components/shared/BackButton';
import { MEASURE_UNIT_LABELS } from '../../server/schemas/productSchema';
import '../../css/shopping.css';

interface PurchaseItem {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product: {
    id: number;
    name: string;
    measureUnit: string;
  };
}

interface Purchase {
  id: number;
  providerId: number;
  totalAmount: number;
  notes: string | null;
  createdAt: string;
  provider: {
    id: number;
    name: string;
  };
  items: PurchaseItem[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function PurchasesList() {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [expandedPurchase, setExpandedPurchase] = useState<number | null>(null);

  const fetchPurchases = async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await ApiService.get<{ success: boolean; data: Purchase[]; pagination: Pagination }>(
        `/api/purchases?page=${page}`
      );
      if (response.success) {
        setPurchases(response.data);
        setPagination(response.pagination);
      } else {
        toast.error(response.error || 'Error al cargar compras');
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
      toast.error('Error al cargar compras');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const togglePurchase = (purchaseId: number) => {
    setExpandedPurchase(expandedPurchase === purchaseId ? null : purchaseId);
  };

  const handlePrevPage = () => {
    if (pagination.page > 1) {
      fetchPurchases(pagination.page - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      fetchPurchases(pagination.page + 1);
    }
  };

  return (
    <div className="shopping-page">
      <header className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BackButton />
          <h1><FontAwesomeIcon icon={faShoppingCart} /> Historial de Compras</h1>
        </div>
      </header>

      {loading ? (
        <div className="loading-indicator">
          <FontAwesomeIcon icon={faShoppingCart} spin size="lg" />
          Cargando...
        </div>
      ) : purchases.length === 0 ? (
        <div className="empty-message">
          No hay compras registradas.
        </div>
      ) : (
        <>
          <div className="purchases-list">
            {purchases.map((purchase) => (
              <div key={purchase.id} className={`purchase-card ${expandedPurchase === purchase.id ? 'expanded' : ''}`}>
                <div className="purchase-header" onClick={() => togglePurchase(purchase.id)}>
                  <div className="purchase-info">
                    <h3>Compra #{purchase.id}</h3>
                    <span className="purchase-provider">{purchase.provider.name}</span>
                    <span className="purchase-date">{formatDate(purchase.createdAt)}</span>
                  </div>
                  <div className="purchase-total">
                    <span className="total-amount">${purchase.totalAmount.toFixed(2)}</span>
                    <FontAwesomeIcon 
                      icon={expandedPurchase === purchase.id ? faChevronUp : faChevronDown} 
                      className="expand-icon"
                    />
                  </div>
                </div>
                {expandedPurchase === purchase.id && (
                  <div className="purchase-details">
                    <ul className="items-list">
                      {purchase.items.map((item) => (
                        <li key={item.id}>
                          <span className="item-qty">{item.quantity} {MEASURE_UNIT_LABELS[item.product.measureUnit as keyof typeof MEASURE_UNIT_LABELS] || item.product.measureUnit}</span>
                          <span className="item-name">{item.product.name}</span>
                          <span className="item-price">@ ${item.unitPrice.toFixed(2)} = ${item.subtotal.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                    {purchase.notes && (
                      <p className="purchase-notes">Nota: {purchase.notes}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

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
        </>
      )}
    </div>
  );
}
