import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar, faCalendarAlt, faCircleNotch, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
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
        setError(response.error || 'Failed to fetch stock movements.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch data for default range (e.g., last month) or leave empty to fetch all initially
    const defaultEndDate = new Date().toISOString().split('T')[0];
    const defaultStartDate = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    fetchStockMovements(1, defaultStartDate, defaultEndDate);
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
  };

  const handlePresetRange = (days: number) => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(new Date().setDate(new Date().getDate() - days)).toISOString().split('T')[0];
    setStartDate(startDate);
    setEndDate(endDate);
    fetchStockMovements(1, startDate, endDate);
  };

  const formatCreatedAt = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateString; // Return original string if parsing fails
    }
  };

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
          Cargando movimientos...
        </div>
      )}

      {!loading && stockMovements.length === 0 && (
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
              </tr>
            </thead>
            <tbody>
              {stockMovements.map((movement) => (
                <tr key={movement.id}>
                  <td>{formatCreatedAt(movement.createdAt)}</td>
                  <td>{movement.product.name}</td>
                  <td className={movement.type === 'IN' ? 'type-in' : 'type-out'}>{movement.type === 'IN' ? 'Entrada' : 'Salida'}</td>
                  <td>{movement.quantity}</td>
                  <td>{MEASURE_UNIT_LABELS[movement.product.measureUnit as keyof typeof MEASURE_UNIT_LABELS] || movement.product.measureUnit}</td>
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
  );
}
