import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar, faCalendarAlt, faCircleNotch, faChevronLeft, faChevronRight, faShoppingBag, faSearch, faFilter } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';

import { ApiService } from '../services/ApiService';
import { BackButton } from '../components/shared/BackButton';
import { MEASURE_UNIT_LABELS } from '../../server/schemas/productSchema';
import '../../css/report.css';

interface StockMovement {
  id: number;
  productId: number;
  type: string; // "IN" | "OUT"
  quantity: number;
  reason?: string | null;
  createdAt: string;
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
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Provider {
  id: number;
  name: string;
}

export function Report() {
  // GASTOS STATE
  const [expenseStart, setExpenseStart] = useState<string>('');
  const [expenseEnd, setExpenseEnd] = useState<string>('');
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  
  // STOCK STATE
  const [stockStart, setStockStart] = useState<string>('');
  const [stockEnd, setStockEnd] = useState<string>('');
  const [stockFilterProduct, setStockFilterProduct] = useState<string>('');
  const [stockFilterProviderId, setStockFilterProviderId] = useState<string>('');
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });

  // SHARED STATE
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProviders = async () => {
    try {
      const response = await ApiService.get<{ success: boolean; data: Provider[] }>('/api/providers?limit=1000');
      if (response.success) setProviders(response.data);
    } catch (err) {
      console.error('Error fetching providers', err);
    }
  };

  const fetchStockMovements = async (page: number = 1) => {
    try {
      setLoading(true);
      let url = `/api/stock-movements?page=${page}`;
      if (stockStart) url += `&from=${stockStart}`;
      if (stockEnd) url += `&to=${stockEnd}`;
      if (stockFilterProduct) url += `&productName=${stockFilterProduct}`;
      if (stockFilterProviderId) url += `&providerId=${stockFilterProviderId}`;

      const response = await ApiService.get<{ success: boolean; data: StockMovement[]; pagination: Pagination }>(url);
      if (response.success) {
        setStockMovements(response.data);
        setPagination(response.pagination);
      }
    } catch (err: any) {
      toast.error('Error al cargar movimientos');
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const response = await ApiService.get<{ success: boolean; data: Purchase[] }>(`/api/purchases?limit=1000`);
      if (response.success) {
        const filtered = response.data.filter(p => {
          const d = new Date(p.createdAt);
          const start = expenseStart ? new Date(expenseStart) : null;
          const end = expenseEnd ? new Date(expenseEnd) : null;
          if (start && d < new Date(start.setHours(0,0,0,0))) return false;
          if (end && d > new Date(end.setHours(23,59,59,999))) return false;
          return true;
        });
        setPurchases(filtered);
      }
    } catch (err) {
      toast.error('Error al cargar gastos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const monthAgo = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
    
    setExpenseStart(monthAgo);
    setExpenseEnd(today);
    setStockStart(monthAgo);
    setStockEnd(today);

    fetchProviders();
    // Initial fetch
    fetchPurchases();
    fetchStockMovements(1);
  }, []);

  const handlePresetExpense = (days: number) => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(new Date().setDate(new Date().getDate() - days)).toISOString().split('T')[0];
    setExpenseStart(start);
    setExpenseEnd(end);
  };

  const handlePresetStock = (days: number) => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(new Date().setDate(new Date().getDate() - days)).toISOString().split('T')[0];
    setStockStart(start);
    setStockEnd(end);
  };

  const formatCreatedAt = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Calculations
  const totalSpent = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const expensesByProvider: Record<string, number> = purchases.reduce((acc, p) => {
    const name = p.provider.name;
    acc[name] = (acc[name] || 0) + p.totalAmount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="report-page">
      <header className="report-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BackButton />
          <h1><FontAwesomeIcon icon={faChartBar} /> Reporte</h1>
        </div>
      </header>

      {/* SECCIÓN GASTOS */}
      <section className="expense-summary-card">
        <h2><FontAwesomeIcon icon={faShoppingBag} /> Gastos y Compras</h2>
        
        <div className="date-filter-card" style={{ boxShadow: 'none', border: '1px solid var(--color-border)', marginBottom: '16px' }}>
          <div className="date-inputs">
            <div className="date-input-group">
              <label>Desde:</label>
              <input type="date" value={expenseStart} onChange={(e) => setExpenseStart(e.target.value)} />
            </div>
            <div className="date-input-group">
              <label>Hasta:</label>
              <input type="date" value={expenseEnd} onChange={(e) => setExpenseEnd(e.target.value)} />
            </div>
          </div>
          <div className="preset-buttons">
            <button className="preset-btn" onClick={() => handlePresetExpense(7)}>7 días</button>
            <button className="preset-btn" onClick={() => handlePresetExpense(30)}>30 días</button>
          </div>
          <button onClick={fetchPurchases} className="btn-apply-filter">Actualizar Gastos</button>
        </div>

        <div className="summary-grid">
          <div className="summary-item">
            <h3 style={{fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0 0 4px'}}>Total Gastado</h3>
            <p>${totalSpent.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="summary-item">
            <h3 style={{fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0 0 4px'}}>Compras</h3>
            <p>{purchases.length}</p>
          </div>
        </div>

        {Object.keys(expensesByProvider).length > 0 && (
          <div className="provider-expenses-table">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Proveedor</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(expensesByProvider)
                  .sort((a, b) => b[1] - a[1])
                  .map(([name, amount]) => (
                    <tr key={name}>
                      <td>{name}</td>
                      <td>${amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* SECCIÓN MOVIMIENTOS DE STOCK */}
      <section className="stock-movements-card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <FontAwesomeIcon icon={faFilter} style={{ color: 'var(--color-primary)' }} /> 
          Movimientos de Stock
        </h2>

        <div className="stock-filter-panel">
          <div className="stock-filter-row">
            <div className="date-input-group">
              <label>Desde:</label>
              <input type="date" value={stockStart} onChange={(e) => setStockStart(e.target.value)} />
            </div>
            <div className="date-input-group">
              <label>Hasta:</label>
              <input type="date" value={stockEnd} onChange={(e) => setStockEnd(e.target.value)} />
            </div>
          </div>
          
          <div className="preset-buttons">
            <button className="preset-btn" onClick={() => handlePresetStock(7)}>7 días</button>
            <button className="preset-btn" onClick={() => handlePresetStock(30)}>30 días</button>
          </div>

          <div className="stock-filter-row">
            <div className="date-input-group">
              <label>Producto:</label>
              <input 
                type="text" 
                placeholder="Nombre del producto..." 
                value={stockFilterProduct} 
                onChange={(e) => setStockFilterProduct(e.target.value)} 
              />
            </div>
            <div className="date-input-group">
              <label>Proveedor:</label>
              <select value={stockFilterProviderId} onChange={(e) => setStockFilterProviderId(e.target.value)}>
                <option value="">Todos los proveedores</option>
                {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <button onClick={() => fetchStockMovements(1)} className="btn-apply-filter">
            <FontAwesomeIcon icon={faSearch} /> Buscar Movimientos
          </button>
        </div>

        {loading && (
          <div className="report-loading">
            <FontAwesomeIcon icon={faCircleNotch} spin /> Cargando...
          </div>
        )}

        {!loading && stockMovements.length === 0 && (
          <div className="report-empty">No hay movimientos con estos filtros.</div>
        )}

        {!loading && stockMovements.length > 0 && (
          <div className="movement-cards-list">
            {stockMovements.map(m => (
              <div key={m.id} className="movement-card">
                <div className="movement-card-header">
                  <span className="date">{formatCreatedAt(m.createdAt)}</span>
                  <span className={m.type === 'IN' ? 'badge-in' : 'badge-out'}>
                    {m.type === 'IN' ? 'Entrada' : 'Salida'}
                  </span>
                </div>
                <div className="movement-card-body">
                  <span className="movement-product-name">{m.product?.name || 'Producto Eliminado'}</span>
                  <div className="movement-card-details">
                    <span className="movement-provider">{m.product?.provider?.name || '—'}</span>
                    <span className="movement-qty">
                      {m.quantity} {MEASURE_UNIT_LABELS[m.product?.measureUnit as keyof typeof MEASURE_UNIT_LABELS] || m.product?.measureUnit}
                    </span>
                  </div>
                  {m.reason && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontStyle: 'italic', marginTop: '4px', borderTop: '1px dashed var(--color-border)', paddingTop: '4px' }}>
                      {m.reason}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination.total > 0 && (
          <div className="pagination">
            <button 
              className="btn-pagination" 
              onClick={() => fetchStockMovements(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              Página {pagination.page} de {pagination.totalPages} ({pagination.total} resultados)
            </span>
            <button 
              className="btn-pagination" 
              onClick={() => fetchStockMovements(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
