import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxOpen, faPlus, faEdit, faTrashAlt, faCircleNotch, faExclamationTriangle, faAddressBook, faChevronLeft, faChevronRight, faSearch } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';

import { ApiService } from '../services/ApiService';
import { BackButton } from '../components/shared/BackButton';
import { ProductSchema, ProductInput, MEASURE_UNIT_LABELS } from '../../server/schemas/productSchema';
import { Provider } from '../../server/schemas/providerSchema';
import '../../css/products.css';

// Define a more specific type for product details including provider
interface ProductWithProvider extends ProductInput {
  id: number; // Assuming ID is returned by the API
  provider: {
    id: number;
    name: string;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function Product() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const filterProviderId = queryParams.get('providerId');

  const [products, setProducts] = useState<ProductWithProvider[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<any>(null); // For form validation errors
  const [searchTerm, setSearchTerm] = useState<string>('');

  // State for the creation/editing form
  const [isFormVisible, setIsFormVisible] = useState<boolean>(!!filterProviderId);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentProductData, setCurrentProductData] = useState<ProductInput>({
    providerId: filterProviderId ? parseInt(filterProviderId) : 0,
    name: '',
    description: '',
    quantity: 0,
    measureUnit: 'KG',
    minStock: 0,
  });

  const fetchProviders = async () => {
    try {
      const response = await ApiService.get<{ success: boolean; data: Provider[] }>('/api/providers');
      if (response.success) {
        setProviders(response.data);
        // If we don't have a filterProviderId and current providerId is 0, set to first provider
        if (!filterProviderId && response.data.length > 0 && currentProductData.providerId === 0) {
          setCurrentProductData(prev => ({ ...prev, providerId: response.data[0].id }));
        }
      } else {
        toast.error(response.error || 'Error al cargar proveedores.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar proveedores.');
    }
  };

  const fetchProducts = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      let url = `/api/products?page=${page}`;
      if (filterProviderId) {
        url += `&providerId=${filterProviderId}`;
      }
      const response = await ApiService.get<{ success: boolean; data: ProductWithProvider[]; pagination: Pagination }>(url);
      if (response.success) {
        setProducts(response.data);
        setPagination(response.pagination);
      } else {
        setError(response.error || 'Error al cargar productos.');
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
    fetchProducts();
    // Pre-select provider and show form if filterProviderId is present in URL
    if (filterProviderId && !isEditing) {
      const targetId = parseInt(filterProviderId);
      setCurrentProductData(prev => ({ ...prev, providerId: targetId }));
      setIsFormVisible(true);
    }
  }, [filterProviderId]);

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

  // Handlers for the creation/editing form
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentProductData(prev => ({ ...prev, [name]: value }));
    if (errors?.[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numberValue = Math.max(0, parseInt(value, 10) || 0);
    setCurrentProductData(prev => ({ ...prev, [name]: numberValue }));
    if (errors?.[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors(null);

    const validation = ProductSchema.safeParse(currentProductData);

    if (!validation.success) {
      const flattenedErrors = validation.error.flatten();
      setErrors(flattenedErrors.fieldErrors);
      toast.error('Por favor, corrija los errores en el formulario.');
      setIsSubmitting(false);
      return;
    }

    try {
      let response;
      if (isEditing && (currentProductData as any).id) {
        // Update existing product
        response = await ApiService.put(`/api/products/${(currentProductData as any).id}`, validation.data);
        if (response.success) {
          toast.success('¡Producto actualizado correctamente!');
          setProducts(products.map(p => p.id === (currentProductData as any).id ? { ...validation.data, id: p.id, provider: providers.find(prov => prov.id === validation.data.providerId) || null } : p));
          setIsFormVisible(false); // Hide form after successful update
        } else {
          toast.error(response.error || 'Error al actualizar el producto.');
          if (response.errors) setErrors(response.errors);
        }
      } else {
        // Create new product
        response = await ApiService.post('/api/products', validation.data);
        if (response.success && response.data) {
          toast.success('¡Producto creado correctamente!');
          setProducts([...products, { ...response.data, provider: providers.find(prov => prov.id === response.data.providerId) || null }]);
          const defaultId = filterProviderId ? parseInt(filterProviderId) : (providers.length > 0 ? providers[0].id : 0);
          setCurrentProductData({ providerId: defaultId, name: '', description: '', quantity: 0, measureUnit: 'KG', minStock: 0 }); // Reset form
        } else {
          toast.error(response.error || 'Error al crear el producto.');
          if (response.errors) setErrors(response.errors);
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Ocurrió un error inesperado.');
      console.error('Product submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: number, name: string) => {
    if (!window.confirm(`¿Estás seguro de que querés eliminar el producto "${name}"? Esta acción no se puede deshacer.`)) {
        return;
    }
    try {
        const response = await ApiService.delete(`/api/products/${id}`);
        if (response.success) {
            toast.success(`Producto "${name}" eliminado correctamente.`);
            setProducts(products.filter(p => p.id !== id)); // Remove from state
        } else {
            toast.error(response.error || `Error al eliminar el producto "${name}".`);
        }
    } catch (error: any) {
        toast.error(error.message || `Error al eliminar el producto "${name}".`);
        console.error("Error deleting product:", error);
    }
  };

  const handleEditClick = (product: ProductWithProvider) => {
    setCurrentProductData({
        ...product,
        id: product.id,
    } as any);
    setIsEditing(true);
    setIsFormVisible(true); // Show the form for editing
  };
  
  const toggleForm = () => {
    setIsFormVisible(!isFormVisible);
    setIsEditing(false); // Reset editing state when hiding form
    // Reset form data if hiding, or keep it if toggling between list and form
    // Respect filterProviderId if it exists
    const defaultProviderId = filterProviderId ? parseInt(filterProviderId) : (providers.length > 0 ? providers[0].id : 0);
    setCurrentProductData({ providerId: defaultProviderId, name: '', description: '', quantity: 0, measureUnit: 'KG', minStock: 0 });
    setErrors(null); // Clear errors when toggling
  };

  // Helper to get product details for display in table
  const getProductDetails = (product: ProductWithProvider) => {
      const productProvider = product.provider ? product.provider.name : 'N/A';
      return { providerName: productProvider };
  };

  const getProviderName = () => {
    if (!filterProviderId || providers.length === 0) return null;
    const provider = providers.find(p => p.id === parseInt(filterProviderId));
    return provider ? provider.name : null;
  };

  const handleResetFilter = () => {
    navigate('/products');
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="products-page">
      <header className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BackButton />
          <h1><FontAwesomeIcon icon={faBoxOpen} /> Productos</h1>
        </div>
        <button onClick={toggleForm} className="btn-add-new">
          <FontAwesomeIcon icon={isFormVisible && isEditing ? faAddressBook : faPlus} /> 
          {isFormVisible ? (isEditing ? "Volver" : "Ocultar") : "Nuevo"}
        </button>
      </header>

      {isFormVisible && (
        <div className="form-section">
          <h2>{isEditing ? 'Editar' : 'Nuevo Producto'}</h2>
          <form onSubmit={handleSubmit} className="product-form">
            <div className="form-field">
              <label htmlFor="providerId">Proveedor (*)</label>
              <select
                id="providerId"
                name="providerId"
                value={currentProductData.providerId}
                onChange={handleFormChange}
                disabled={loading || providers.length === 0}
                required
              >
                <option value={0} disabled>Seleccionar</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name} {provider.cuit ? `(${provider.cuit})` : ''}
                  </option>
                ))}
              </select>
              {errors?.providerId && <p className="error-message">{errors.providerId[0]}</p>}
              {loading && <FontAwesomeIcon icon={faCircleNotch} spin />}
              {providers.length === 0 && !loading && <p className="error-message">No hay proveedores. Agrega uno primero.</p>}
            </div>

            <div className="form-field">
              <label htmlFor="name">Nombre (*)</label>
              <input
                type="text"
                id="name"
                name="name"
                value={currentProductData.name}
                onChange={handleFormChange}
                required
              />
              {errors?.name && <p className="error-message">{errors.name[0]}</p>}
            </div>

            <div className="form-field">
              <label htmlFor="description">Descripción (opcional)</label>
              <textarea
                id="description"
                name="description"
                value={currentProductData.description || ''}
                onChange={handleFormChange}
              />
              {errors?.description && <p className="error-message">{errors.description[0]}</p>}
            </div>

            <div className="form-field">
              <label htmlFor="measureUnit">Unidad de medida (*)</label>
              <select
                id="measureUnit"
                name="measureUnit"
                value={currentProductData.measureUnit}
                onChange={handleFormChange}
                required
              >
                {Object.entries(MEASURE_UNIT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {errors?.measureUnit && <p className="error-message">{errors.measureUnit[0]}</p>}
            </div>

            <div className="form-field quantity-unit-fields">
              <div className="quantity-field">
                <label htmlFor="quantity">Cantidad en stock (*)</label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={currentProductData.quantity}
                  onChange={handleNumberChange}
                  min="0"
                  required
                />
                {errors?.quantity && <p className="error-message">{errors.quantity[0]}</p>}
              </div>
              <div className="minstock-field">
                <label htmlFor="minStock">Stock Mínimo</label>
                <input
                  type="number"
                  id="minStock"
                  name="minStock"
                  value={currentProductData.minStock}
                  onChange={handleNumberChange}
                  min="0"
                />
                {errors?.minStock && <p className="error-message">{errors.minStock[0]}</p>}
              </div>
            </div>

            <button type="submit" className="btn-save" disabled={isSubmitting || providers.length === 0}>
              {isSubmitting ? (
                <FontAwesomeIcon icon={faCircleNotch} spin />
              ) : (
                <>
                  <FontAwesomeIcon icon={faPlus} /> {isEditing ? "Actualizar" : "Agregar"}
                </>
              )}
            </button>
            {!isEditing && (
                <button type="button" onClick={toggleForm} className="btn-cancel-form" disabled={isSubmitting}>
                    Cancelar
                </button>
            )}
          </form>
        </div>
      )}
      
      <div className="products-list-section">
        {!isFormVisible && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h2 style={{ margin: 0 }}>{filterProviderId ? `Insumos de: ${getProviderName() || '...'}` : 'Productos Existentes'}</h2>
              {filterProviderId && (
                <button onClick={handleResetFilter} className="btn-add-new" style={{ background: 'var(--color-text-secondary)', padding: '8px 16px', minHeight: 'auto' }}>
                  Ver Todos
                </button>
              )}
            </div>

            <div className="search-container">
              <div className="search-wrapper">
                <FontAwesomeIcon icon={faSearch} className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
          </>
        )}
        {loading && (
          <div className="loading-indicator">
            <FontAwesomeIcon icon={faCircleNotch} spin size="lg" />
            Cargando...
          </div>
        )}
        {error && (
          <div className="error-message">
            <FontAwesomeIcon icon={faExclamationTriangle} />
            Error: {error}
          </div>
        )}
        {!loading && !error && filteredProducts.length === 0 && !isFormVisible && (
          <div className="products-empty">
            {searchTerm ? `No se encontraron productos que coincidan con "${searchTerm}".` : 'No hay productos. Agrega uno usando el formulario.'}
          </div>
        )}
        {!loading && !error && filteredProducts.length > 0 && !isFormVisible && (
          <div className="products-table-container">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Proveedor</th>
                  <th>Cantidad</th>
                  <th>Unidad</th>
                  <th>Stock Mín</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{getProductDetails(product).providerName}</td>
                    <td>{product.quantity}</td>
                    <td>{MEASURE_UNIT_LABELS[product.measureUnit as keyof typeof MEASURE_UNIT_LABELS] || product.measureUnit}</td>
                    <td>{product.minStock}</td>
                    <td>
                      <div className="action-buttons">
                        <button onClick={() => handleEditClick(product)} className="btn-edit">
                          <FontAwesomeIcon icon={faEdit} /> Editar
                        </button>
                        <button onClick={() => handleDeleteProduct(product.id, product.name)} className="btn-delete">
                          <FontAwesomeIcon icon={faTrashAlt} /> Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalPages > 1 && !isFormVisible && (
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
    </div>
  );
}

/*
// Basic CSS for Product page (to be added to a CSS file, e.g., product.css)
.products-page-container {
  padding: 20px;
  font-family: sans-serif;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  background-color: #fff;
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-header h1 {
  margin: 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-add-new {
  background-color: #007bff;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-add-new:hover {
  background-color: #0056b3;
}

.form-section {
  background-color: #f9f9f9;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.form-section h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #444;
}

.products-list-section h2 {
  margin-bottom: 15px;
  color: #444;
}

.loading-indicator, .error-message {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px;
  font-weight: bold;
}

.error-message {
  color: #dc3545;
}

.products-table-container {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.products-table-container table {
  width: 100%;
  border-collapse: collapse;
}

.products-table-container th,
.products-table-container td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.products-table-container th {
  background-color: #f2f2f2;
  font-weight: bold;
  color: #555;
}

.products-table-container tr:last-child td {
  border-bottom: none;
}

.products-table-container td {
  color: #333;
}

.products-table-container .actions {
  display: flex;
  gap: 10px;
}

.btn-edit, .btn-delete {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-edit {
  background-color: #ffc107; // Yellow for edit
  color: #212529;
}

.btn-edit:hover {
  background-color: #e0a800;
}

.btn-delete {
  background-color: #dc3545; // Red for delete
  color: white;
}

.btn-delete:hover {
  background-color: #c82333;
}

.btn-save {
  background-color: #007bff;
  color: white;
  padding: 12px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1.1em;
  transition: background-color 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  margin-top: 10px;
}

.btn-save:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-save:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.btn-cancel-form {
  background-color: #6c757d;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.3s ease;
  margin-left: 10px;
}

.btn-cancel-form:hover {
  background-color: #5a6268;
}
*/
