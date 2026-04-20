import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar, faCalendarAlt, faCircleNotch, faChevronLeft, faChevronRight, faShoppingBag } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';

import { ApiService } from '../services/ApiService';
import { BackButton } from '../components/shared/BackButton';
import { MEASURE_UNIT_LABELS } from '../../server/schemas/productSchema';
import '../../css/report.css';

// Define the structure for a stock movement response
interface StockMovement {
  id: number;
  productId: number;
  type: string; // "IN" | "OUT"
  quantity: number;
  reason?: string | null;
  createdAt: string; // ISO string from backend
  product: {
    id: number;
    name: string;
    measureUnit: string;
    provider: {
      id: number;
      name: string;
    } | null;
  };
}

// Define the structure for a purchase response
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
  items: Array<{
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
  }>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function Report() {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });

  const fetchStockMovements = async (page: number = 1, from?: string, to?: string) => {
    try {
      setLoading(true);
      setError(null);
      let url = `/api/stock-movements?page=${page}`;
      if (from) url += `&from=${from}`;
      if (to) url += `&to=${to}`;

      const response = await ApiService.get<{ success: boolean; data: StockMovement[]; pagination: Pagination }>(url);
      if (response.success) {
        setStockMovements(response.data);
        setPagination(response.pagination);
      } else {
        setError(response.error || 'Error al cargar movimientos de stock.');
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado al cargar movimientos.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchasesForReport = async (from?: string, to?: string) => {
    try {
      setLoading(true); // Use same loading state for both fetches for simplicity
      setError(null);
      // Fetching with limit=1000 as requested and filtering client-side
      const response = await ApiService.get<{ success: boolean; data: Purchase[] }>(`/api/purchases?limit=1000`);
      if (response.success) {
        const filteredPurchases = response.data.filter(purchase => {
          const purchaseDate = new Date(purchase.createdAt);
          const startDateObj = from ? new Date(from) : null;
          const endDateObj = to ? new Date(to) : null;

          let isAfterStart = true;
          if (startDateObj) {
            // Ensure we compare dates correctly, adding end of day for comparison
            const startOfSelectedDay = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate());
            isAfterStart = purchaseDate >= startOfSelectedDay;
          }

          let isBeforeEnd = true;
          if (endDateObj) {
            // Ensure we compare dates correctly, adding end of day for comparison
            const endOfSelectedDay = new Date(endDateObj.getFullYear(), endDateObj.getMonth(), endDateObj.getDate(), 23, 59, 59, 999);
            isBeforeEnd = purchaseDate <= endOfSelectedDay;
          }
          
          return isAfterStart && isBeforeEnd;
        });
        setPurchases(filteredPurchases);
        // Reset pagination for stock movements if it was shown
        setPagination({ page: 1, limit: 10, total: 0, totalPages: 0 });
      } else {
        setError(response.error || 'Error al cargar compras para el reporte.');
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado al cargar compras.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const defaultEndDate = new Date().toISOString().split('T')[0];
    const defaultStartDate = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    fetchStockMovements(1, defaultStartDate, defaultEndDate);
    fetchPurchasesForReport(defaultStartDate, defaultEndDate); // Fetch purchases for report as well
  }, []);

  const handlePrevPage = () => {
    if (pagination.page > 1) {
      fetchStockMovements(pagination.page - 1, startDate, endDate);
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      fetchStockMovements(pagination.page + 1, startDate, endDate);
    }
  };

  const handleDateChange = (setDate: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
  };

  const applyDateFilter = () => {
    fetchStockMovements(1, startDate, endDate);
    fetchPurchasesForReport(startDate, endDate); // Re-fetch purchases with new dates
  };

  const handlePresetRange = (days: number) => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(new Date().setDate(new Date().getDate() - days)).toISOString().split('T')[0];
    setStartDate(startDate);
    setEndDate(endDate);
    fetchStockMovements(1, startDate, endDate);
    fetchPurchasesForReport(startDate, endDate); // Re-fetch purchases with new dates
  };

  const formatCreatedAt = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateString; // Return original string if parsing fails
    }
  };

  // Expense Summary Calculations
  const totalSpent = purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);
  const purchaseCount = purchases.length;
  
  const expensesByProvider: Record<string, number> = purchases.reduce((acc, purchase) => {
    const providerName = purchase.provider.name;
    acc[providerName] = (acc[providerName] || 0) + purchase.totalAmount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="report-page">
      <div className="report-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BackButton />
          <h1><FontAwesomeIcon icon={faChartBar} /> Reporte</h1>
        </div>
      </div>

      <div className="date-filter-card">
        <div className="date-inputs">
          <div className="date-input-group">
            <label htmlFor="startDate">Desde:</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={handleDateChange(setStartDate)}
            />
          </div>
          <div className="date-input-group">
            <label htmlFor="endDate">Hasta:</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={handleDateChange(setEndDate)}
            />
          </div>
        </div>
        <div className="preset-buttons">
          <button onClick={() => handlePresetRange(7)} disabled={loading}>7 días</button>
          <button onClick={() => handlePresetRange(30)} disabled={loading}>30 días</button>
        </div>
        <button onClick={applyDateFilter} className="btn-apply-filter" disabled={loading}>Aplicar Filtro</button>
      </div>

      {loading && (
        <div className="report-loading">
          <FontAwesomeIcon icon={faCircleNotch} spin size="lg" />
          Cargando datos...
        </div>
      )}

      {!loading && (
        <>
          {/* New Section: Expense Summary */}
          <div className="expense-summary-card">
            <h2><FontAwesomeIcon icon={faShoppingBag} /> Resumen de Gastos</h2>
            <div className="summary-grid">
              <div className="summary-item">
                <h3>Total Gastado</h3>
                <p>${totalSpent.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="summary-item">
                <h3>Cantidad de Compras</h3>
                <p>{purchaseCount}</p>
              </div>
            </div>

            {Object.keys(expensesByProvider).length > 0 && (
              <div className="provider-expenses-table">
                <h3>Gastos por Proveedor</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Proveedor</th>
                      <th>Total Gastado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(expensesByProvider)
                      .sort(([, amountA], [, amountB]) => amountB - amountA) // Sort by amount descending
                      .map(([providerName, amount]) => (
                        <tr key={providerName}>
                          <td>{providerName}</td>
                          <td>${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="purchases-list-section">
              <h3>Detalle de Compras del Período</h3>
              {purchases.length === 0 ? (
                <div className="report-empty">
                  No se encontraron compras en el período seleccionado.
                </div>
              ) : (
                <div className="table-container">
                  <table className="report-table purchases-detail-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Proveedor</th>
                        <th>Notas</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchases.map((purchase) => (
                        <tr key={purchase.id}>
                          <td>{formatCreatedAt(purchase.createdAt)}</td>
                          <td>{purchase.provider.name}</td>
                          <td>{purchase.notes || '—'}</td>
                          <td>${purchase.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Existing Section: Stock Movements */}
          <div className="stock-movements-card">
            <h2><FontAwesomeIcon icon={faChartBar} /> Movimientos de Stock</h2>
            {stockMovements.length === 0 && !loading && (
              <div className="report-empty">
                No se encontraron movimientos de stock en el período seleccionado.
              </div>
            )}

            {!loading && stockMovements.length > 0 && (
              <div className="table-container">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Producto</th>
                      <th>Tipo</th>
                      <th>Cantidad</th>
                      <th>Unidad</th>
                      {/* Added columns based on Correction 8 */}
                      <th>Proveedor</th>
                      <th>Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockMovements.map((movement) => (
                      <tr key={movement.id}>
                        <td>{formatCreatedAt(movement.createdAt)}</td>
                        <td>{movement.product?.name || 'Producto Eliminado'}</td>
                        <td className={movement.type === 'IN' ? 'type-in' : 'type-out'}>{movement.type === 'IN' ? 'Entrada' : 'Salida'}</td>
                        <td>{movement.quantity}</td>
                        <td>{MEASURE_UNIT_LABELS[movement.product?.measureUnit as keyof typeof MEASURE_UNIT_LABELS] || movement.product?.measureUnit || 'N/A'}</td>
                        {/* Added columns based on Correction 8 */}
                        <td>{movement.product?.provider?.name || '—'}</td>
                        <td>{movement.reason || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
        </>
      )}
    </div>
  );
}
