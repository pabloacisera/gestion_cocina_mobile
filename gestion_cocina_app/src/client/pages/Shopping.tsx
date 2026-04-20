import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faPlus, faTimes, faCircleNotch, faTrash, faSearch, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';

import { ApiService } from '../services/ApiService';
import { BackButton } from '../components/shared/BackButton';
import { Product, MEASURE_UNIT_LABELS } from '../../server/schemas/productSchema';
import { Provider } from '../../server/schemas/providerSchema';
import '../../css/shopping.css';

interface ProductWithProvider extends Product {
  id: number;
  measureUnit: string;
  purchaseUnit?: string | null;
  conversionFactor?: number;
  provider: {
    id: number;
    name: string;
  } | null;
}

interface ProviderData {
  id: number;
  name: string;
  cuit: string | null;
  address: string | null;
}

interface PurchaseItem {
  id: string;
  productId?: number;
  productName: string;
  stockUnit: string;
  purchaseUnit: string;
  conversionFactor: number;
  purchaseQty: number;
  unitPrice: number;
  subtotal: number;
  isNew?: boolean;
  description?: string;
  minStock?: number;
}

interface InventoryAlert extends Product {
  id: number;
  measureUnit: string;
  provider: {
    id: number;
    name: string;
  } | null;
}

export function Shopping() {
  const navigate = useNavigate();
  
  // Providers state
  const [providers, setProviders] = useState<ProviderData[]>([]);
  const [loadingProviders, setLoadingProviders] = useState<boolean>(true);
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  
  // Products state (for selector)
  const [products, setProducts] = useState<ProductWithProvider[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
  
  // Purchase items state (invoice lines)
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [showProductSelector, setShowProductSelector] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  // New Product Inline Form state
  const [showNewProductForm, setShowNewProductForm] = useState<boolean>(false);
  const [newProductData, setNewProductData] = useState({
    name: '',
    measureUnit: 'KG',
    description: '',
    minStock: 0,
    quantity: 1,
    unitPrice: 0,
    purchaseUnit: '',
    conversionFactor: 1,
  });

  // New Provider state
  const [isNewProvider, setIsNewProvider] = useState<boolean>(false);
  const [newProviderName, setNewProviderName] = useState<string>('');

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Alerts state (stock below min)
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState<boolean>(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoadingProviders(true);
    setLoadingAlerts(true);
    
    try {
      const [providersRes, alertsRes] = await Promise.all([
        ApiService.get<{ success: boolean; data: ProviderData[] }>('/api/providers?limit=1000'),
        ApiService.get<{ success: boolean; data: InventoryAlert[]; count: number }>('/api/inventory/alerts'),
      ]);
      
      if (providersRes.success) setProviders(providersRes.data);
      if (alertsRes.success) setAlerts(alertsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoadingProviders(false);
      setLoadingAlerts(false);
    }
  };

  const fetchProductsForProvider = async (providerId: number) => {
    setLoadingProducts(true);
    try {
      const response = await ApiService.get<{ success: boolean; data: ProductWithProvider[] }>(`/api/products?limit=1000&providerId=${providerId}`);
      if (response.success) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (selectedProviderId && !isNewProvider) {
      fetchProductsForProvider(selectedProviderId);
    } else {
      setProducts([]);
    }
  }, [selectedProviderId, isNewProvider]);

  const calculateTotal = () => {
    return purchaseItems.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handleAddProduct = (product: ProductWithProvider) => {
    const newItem: PurchaseItem = {
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      stockUnit: product.measureUnit,
      purchaseUnit: product.purchaseUnit || product.measureUnit,
      conversionFactor: product.conversionFactor ?? 1,
      purchaseQty: 1,
      unitPrice: 0,
      subtotal: 0,
    };
    setPurchaseItems([...purchaseItems, newItem]);
    setShowProductSelector(false);
    setSearchTerm('');
  };

  const handleAddNewProductItem = () => {
    if (!newProductData.name) {
      toast.error('El nombre del producto es obligatorio');
      return;
    }
    const newItem: PurchaseItem = {
      id: `new-${Date.now()}`,
      productName: newProductData.name,
      stockUnit: newProductData.measureUnit,
      purchaseUnit: newProductData.purchaseUnit || newProductData.measureUnit,
      conversionFactor: newProductData.conversionFactor || 1,
      purchaseQty: newProductData.quantity,
      unitPrice: newProductData.unitPrice,
      subtotal: newProductData.quantity * newProductData.unitPrice,
      isNew: true,
      description: newProductData.description,
      minStock: newProductData.minStock,
    };
    setPurchaseItems([...purchaseItems, newItem]);
    setShowNewProductForm(false);
    setShowProductSelector(false);
    setNewProductData({
      name: '',
      measureUnit: 'KG',
      description: '',
      minStock: 0,
      quantity: 1,
      unitPrice: 0,
      purchaseUnit: '',
      conversionFactor: 1,
    });
  };

  const handleRemoveItem = (id: string) => {
    setPurchaseItems(purchaseItems.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: 'purchaseQty' | 'unitPrice', value: number) => {
    setPurchaseItems(purchaseItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        updatedItem.subtotal = updatedItem.purchaseQty * updatedItem.unitPrice;
        return updatedItem;
      }
      return item;
    }));
  };

  const handleConfirmPurchase = async () => {
    if (purchaseItems.length === 0) {
      toast.error('Agrega al menos un producto a la compra.');
      return;
    }

    let finalProviderId = selectedProviderId;

    setIsSubmitting(true);
    try {
      if (isNewProvider) {
        if (!newProviderName) {
          toast.error('El nombre del nuevo proveedor es obligatorio');
          setIsSubmitting(false);
          return;
        }
        const provRes = await ApiService.post<{ success: boolean; data: ProviderData }>('/api/providers', { name: newProviderName });
        if (provRes.success && provRes.data) {
          finalProviderId = provRes.data.id;
        } else {
          toast.error('Error al crear el nuevo proveedor');
          setIsSubmitting(false);
          return;
        }
      }

      if (!finalProviderId) {
        toast.error('Selecciona un proveedor.');
        setIsSubmitting(false);
        return;
      }

      const purchaseData = {
        providerId: finalProviderId,
        notes: notes,
        items: purchaseItems.map(item => ({
          productId: item.productId,
          isNew: item.isNew,
          name: item.productName,
          measureUnit: item.stockUnit,
          purchaseUnit: item.purchaseUnit,
          conversionFactor: item.conversionFactor,
          description: item.description,
          minStock: item.minStock,
          purchaseQty: item.purchaseQty,
          unitPrice: item.unitPrice,
        })),
      };

      const response = await ApiService.post<{ success: boolean; error?: string }>('/api/purchases', purchaseData);
      
      if (response.success) {
        toast.success('Compra registrada con éxito');
        navigate('/purchases-list');
      } else {
        toast.error(response.error || 'Error al registrar la compra');
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error(error.message || 'Error inesperado al procesar la compra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !purchaseItems.some(item => item.productId === p.id)
  );

  return (
    <div className="shopping-page">
      <header className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BackButton />
          <h1><FontAwesomeIcon icon={faShoppingCart} /> Nueva Compra</h1>
        </div>
      </header>

      <div className="shopping-container">
        <div className="shopping-main">
          {/* Section 1: Provider Selection */}
          <section className="shopping-section provider-selection">
            <h2>1. Seleccionar Proveedor</h2>
            <div className="provider-controls">
              {!isNewProvider ? (
                <div className="form-group">
                  <select 
                    value={selectedProviderId || ''} 
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'new') {
                        setIsNewProvider(true);
                        setSelectedProviderId(null);
                      } else {
                        setSelectedProviderId(val ? Number(val) : null);
                      }
                    }}
                    disabled={loadingProviders}
                    className="provider-select"
                  >
                    <option value="">-- Seleccionar Proveedor --</option>
                    {providers.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                    <option value="new">+ Nuevo Proveedor...</option>
                  </select>
                </div>
              ) : (
                <div className="form-group new-provider-input">
                  <input 
                    type="text" 
                    placeholder="Nombre del nuevo proveedor"
                    value={newProviderName}
                    onChange={(e) => setNewProviderName(e.target.value)}
                    autoFocus
                    className="input-text"
                  />
                  <button className="btn-cancel-small" onClick={() => setIsNewProvider(false)}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Section 2: Product Selection / Cart */}
          <section className="shopping-section items-section">
            <div className="section-header">
              <h2>2. Productos de la Compra</h2>
              <button 
                className="btn-add-item" 
                onClick={() => setShowProductSelector(true)}
                disabled={(!selectedProviderId && !isNewProvider)}
              >
                <FontAwesomeIcon icon={faPlus} /> Agregar Producto
              </button>
            </div>

            {showProductSelector && (
              <div className="product-selector-overlay" onClick={() => {setShowProductSelector(false); setShowNewProductForm(false);}}>
                <div className="product-selector-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>Seleccionar Producto</h3>
                    <button className="btn-close" onClick={() => {setShowProductSelector(false); setShowNewProductForm(false);}}>
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                  
                  {!showNewProductForm ? (
                    <>
                      <div className="search-bar">
                        <FontAwesomeIcon icon={faSearch} />
                        <input 
                          type="text" 
                          placeholder="Buscar producto existente..." 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="product-options-list">
                        <div 
                          className="product-option new-product-option"
                          onClick={() => setShowNewProductForm(true)}
                        >
                          <FontAwesomeIcon icon={faPlus} />
                          <span><strong>Producto Nuevo</strong> (crear e incluir)</span>
                        </div>
                        
                        {loadingProducts ? (
                          <div className="loading-inline"><FontAwesomeIcon icon={faCircleNotch} spin /> Cargando...</div>
                        ) : (
                          filteredProducts.map(p => (
                            <div key={p.id} className="product-option" onClick={() => handleAddProduct(p)}>
                              <div className="product-info">
                                <span className="product-name">{p.name}</span>
                                <span className="product-unit">{MEASURE_UNIT_LABELS[p.measureUnit as keyof typeof MEASURE_UNIT_LABELS] || p.measureUnit}</span>
                              </div>
                              <FontAwesomeIcon icon={faPlus} />
                            </div>
                          ))
                        )}
                        {!loadingProducts && filteredProducts.length === 0 && searchTerm && (
                          <div className="no-results">No se encontraron productos para "{searchTerm}"</div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="new-product-inline-form">
                      <h4>Datos del Producto Nuevo</h4>
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Nombre (*)</label>
                          <input 
                            type="text" 
                            value={newProductData.name} 
                            onChange={(e) => setNewProductData({...newProductData, name: e.target.value})}
                            placeholder="Ej: Tomates"
                          />
                        </div>
                        <div className="form-group">
                          <label>Unidad de medida (*)</label>
                          <select 
                            value={newProductData.measureUnit} 
                            onChange={(e) => setNewProductData({...newProductData, measureUnit: e.target.value})}
                          >
                            {Object.entries(MEASURE_UNIT_LABELS).map(([val, label]) => (
                              <option key={val} value={val}>{label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Unidad de compra (opcional)</label>
                          <input 
                            type="text" 
                            value={newProductData.purchaseUnit || ''} 
                            onChange={(e) => setNewProductData({...newProductData, purchaseUnit: e.target.value})}
                            placeholder="bidón, caja, bolsa..."
                          />
                        </div>
                        {newProductData.purchaseUnit && (
                          <div className="form-group">
                            <label>Factor de conversión</label>
                            <input 
                              type="number" 
                              min="0.001"
                              step="0.001"
                              value={newProductData.conversionFactor} 
                              onChange={(e) => setNewProductData({...newProductData, conversionFactor: parseFloat(e.target.value) || 1})}
                            />
                          </div>
                        )}
                        <div className="form-group full-width">
                          <label>Descripción (opcional)</label>
                          <textarea 
                            value={newProductData.description} 
                            onChange={(e) => setNewProductData({...newProductData, description: e.target.value})}
                          />
                        </div>
                        <div className="form-group">
                          <label>Stock Mínimo</label>
                          <input 
                            type="number" 
                            min="0" 
                            step="0.001"
                            value={newProductData.minStock} 
                            onChange={(e) => setNewProductData({...newProductData, minStock: Number(e.target.value)})}
                          />
                        </div>
                        <div className="form-group">
                          <label>Cantidad a comprar (*)</label>
                          <input 
                            type="number" 
                            min="0.001"
                            step="0.001"
                            value={newProductData.quantity} 
                            onChange={(e) => setNewProductData({...newProductData, quantity: Number(e.target.value)})}
                          />
                        </div>
                        <div className="form-group">
                          <label>Precio Unitario (*)</label>
                          <input 
                            type="number" 
                            step="0.01" 
                            min="0" 
                            value={newProductData.unitPrice} 
                            onChange={(e) => setNewProductData({...newProductData, unitPrice: Number(e.target.value)})}
                          />
                        </div>
                      </div>
                      <div className="form-actions">
                        <button className="btn-cancel" onClick={() => setShowNewProductForm(false)}>Atrás</button>
                        <button className="btn-confirm" onClick={handleAddNewProductItem}>Agregar al Carrito</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="cart-container">
              {purchaseItems.length === 0 ? (
                <div className="cart-empty">
                  No hay productos en la lista.
                </div>
              ) : (
                <table className="cart-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Unidad</th>
                      <th>Cantidad</th>
                      <th>Precio Unit.</th>
                      <th>Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseItems.map(item => (
                      <tr key={item.id}>
                        <td>
                          {item.productName}
                          {item.isNew && <span className="badge-new">Nuevo</span>}
                        </td>
                        <td>{MEASURE_UNIT_LABELS[item.purchaseUnit as keyof typeof MEASURE_UNIT_LABELS] || item.purchaseUnit}</td>
                        <td>
                          <div className="qty-input-group">
                            <input 
                              type="number" 
                              min="0.001"
                              step="0.001"
                              className="input-table"
                              value={item.purchaseQty} 
                              onChange={(e) => handleItemChange(item.id, 'purchaseQty', parseFloat(e.target.value) || 0)}
                            />
                            <span className="unit-label">{item.purchaseUnit}</span>
                          </div>
                          {item.conversionFactor !== 1 && (
                            <span className="conversion-hint">
                              = {(item.purchaseQty * item.conversionFactor).toFixed(2)} {item.stockUnit}
                            </span>
                          )}
                        </td>
                        <td>
                          <input 
                            type="number" 
                            step="0.01" 
                            min="0"
                            className="input-table"
                            value={item.unitPrice} 
                            onChange={(e) => handleItemChange(item.id, 'unitPrice', Number(e.target.value))}
                          />
                        </td>
                        <td className="col-subtotal">${item.subtotal.toFixed(2)}</td>
                        <td>
                          <button className="btn-remove" onClick={() => handleRemoveItem(item.id)}>
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} className="text-right"><strong>TOTAL COMPRA:</strong></td>
                      <td className="col-total"><strong>${calculateTotal().toFixed(2)}</strong></td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </section>
        </div>

        <aside className="shopping-sidebar">
          <div className="purchase-summary">
            <h3>Resumen y Notas</h3>
            <div className="form-group">
              <label>Notas de la compra</label>
              <textarea 
                placeholder="Ej: Nro de factura, detalles del flete..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            
            <button 
              className="btn-confirm-purchase" 
              onClick={handleConfirmPurchase}
              disabled={isSubmitting || purchaseItems.length === 0}
            >
              {isSubmitting ? <><FontAwesomeIcon icon={faCircleNotch} spin /> Procesando...</> : "Confirmar Compra"}
            </button>
          </div>

          {alerts.length > 0 && (
            <div className="inventory-alerts">
              <h3><FontAwesomeIcon icon={faExclamationTriangle} /> Stock Bajo</h3>
              <div className="alerts-list">
                {alerts.map(alert => (
                  <div key={alert.id} className="alert-item">
                    <span>{alert.name}</span>
                    <span className="alert-qty">{alert.quantity} {MEASURE_UNIT_LABELS[alert.measureUnit as keyof typeof MEASURE_UNIT_LABELS] || alert.measureUnit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
