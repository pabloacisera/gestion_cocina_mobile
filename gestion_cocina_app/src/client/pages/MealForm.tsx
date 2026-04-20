import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faCircleNotch, faSearch, faUtensils } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';

import { ApiService } from '../services/ApiService';
import { BackButton } from '../components/shared/BackButton';
import { Product, MEASURE_UNIT_LABELS } from '../../server/schemas/productSchema';
import '../../css/meals.css';

interface ProductWithStock extends Product {
  id: number;
  measureUnit: string;
  provider: {
    id: number;
    name: string;
  } | null;
}

interface MealIngredient {
  id: string;
  productId: number;
  productName: string;
  measureUnit: string;
  quantity: number;
  availableStock: number;
}

export function MealForm() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const [mealName, setMealName] = useState<string>('');
  const [ingredients, setIngredients] = useState<MealIngredient[]>([]);
  const [showProductSelector, setShowProductSelector] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const defaultName = `Comida del ${new Date().toLocaleDateString('es-AR')}`;
    setMealName(defaultName);

    const fetchProducts = async () => {
      try {
        const response = await ApiService.get<{ success: boolean; data: ProductWithStock[] }>('/api/products?limit=1000');
        if (response.success) {
          const availableProducts = response.data.filter((p: ProductWithStock) => p.quantity > 0);
          setProducts(availableProducts);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Error al cargar productos');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !ingredients.some(ing => ing.productId === p.id)
  );

  const handleAddIngredient = (product: ProductWithStock) => {
    const newIngredient: MealIngredient = {
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      measureUnit: product.measureUnit,
      quantity: 1,
      availableStock: product.quantity
    };
    setIngredients([...ingredients, newIngredient]);
    setShowProductSelector(false);
    setSearchTerm('');
  };

  const handleRemoveIngredient = (id: string) => {
    setIngredients(ingredients.filter(ing => ing.id !== id));
  };

  const handleQuantityChange = (id: string, quantity: number) => {
    setIngredients(ingredients.map(ing => {
      if (ing.id === id) {
        return { ...ing, quantity: Math.max(1, quantity) };
      }
      return ing;
    }));
  };

  const getQuantityWarning = (ingredient: MealIngredient): string | null => {
    if (ingredient.quantity > ingredient.availableStock) {
      return `Stock disponible: ${ingredient.availableStock}`;
    }
    return null;
  };

  const getStockBelowMinWarning = (ingredient: MealIngredient): boolean => {
    const minStock = ingredient.availableStock * 0.3;
    return ingredient.quantity > minStock;
  };

  const handleSubmit = async () => {
    if (!mealName.trim()) {
      toast.error('El nombre de la comida es requerido');
      return;
    }

    if (ingredients.length === 0) {
      toast.error('Debe agregar al menos un ingrediente');
      return;
    }

    const insufficientStock = ingredients.find(ing => ing.quantity > ing.availableStock);
    if (insufficientStock) {
      toast.error(`Stock insuficiente para ${insufficientStock.productName}. Disponible: ${insufficientStock.availableStock}`);
      return;
    }

    const lowStockItems = ingredients.filter(ing => getStockBelowMinWarning(ing));
    if (lowStockItems.length > 0) {
      const itemsList = lowStockItems.map(ing => ing.productName).join(', ');
      if (!window.confirm(`ATENCIÓN: Esta comida consumirá casi todo el stock de: ${itemsList}. ¿Continuar de todos modos?`)) {
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: mealName,
        ingredients: ingredients.map(ing => ({
          productId: ing.productId,
          quantity: ing.quantity
        }))
      };

      const response = await ApiService.post('/api/meals', payload);
      
      if (response.success) {
        toast.success('Comida registrada exitosamente');
        navigate('/meals');
      } else {
        toast.error(response.error || 'Error al registrar comida');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al registrar comida');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/meals');
  };

  if (loading) {
    return (
      <div className="meals-page">
        <div className="loading-indicator">
          <FontAwesomeIcon icon={faCircleNotch} spin size="lg" />
          Cargando...
        </div>
      </div>
    );
  }

  return (
    <div className="meals-page">
      <header className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BackButton />
          <h1><FontAwesomeIcon icon={faUtensils} /> Nueva Comida</h1>
        </div>
      </header>

      <div className="meal-form-card">
        <div className="form-section">
          <h2>Nombre de la Comida</h2>
          <div className="form-field">
            <input
              type="text"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              placeholder="Ej: Almuerzo 19/04"
            />
          </div>
        </div>

        <div className="form-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2>Ingredientes</h2>
            <button 
              onClick={() => setShowProductSelector(true)} 
              className="btn-primary"
              disabled={products.length === 0}
            >
              <FontAwesomeIcon icon={faPlus} /> Agregar
            </button>
          </div>

          {ingredients.length === 0 ? (
            <div className="empty-message">
              No hay ingredientes agregados. Haga clic en "Agregar" para buscar productos.
            </div>
          ) : (
            <div className="ingredients-table-container">
              <table className="ingredients-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Unidad</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map((ingredient) => (
                    <tr key={ingredient.id}>
                      <td>{ingredient.productName}</td>
                      <td>
                        <div className="quantity-input-group">
                          <input
                            type="number"
                            min="1"
                            value={ingredient.quantity}
                            onChange={(e) => handleQuantityChange(ingredient.id, parseInt(e.target.value) || 1)}
                            className={ingredient.quantity > ingredient.availableStock ? 'input-error' : ''}
                          />
                          {getQuantityWarning(ingredient) && (
                            <span className="quantity-warning">{getQuantityWarning(ingredient)}</span>
                          )}
                        </div>
                      </td>
                      <td>{MEASURE_UNIT_LABELS[ingredient.measureUnit as keyof typeof MEASURE_UNIT_LABELS] || ingredient.measureUnit}</td>
                      <td>
                        <button 
                          onClick={() => handleRemoveIngredient(ingredient.id)}
                          className="btn-remove"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button onClick={handleCancel} className="btn-secondary">
            Cancelar
          </button>
          <button 
            onClick={handleSubmit} 
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <FontAwesomeIcon icon={faCircleNotch} spin />
            ) : (
              <>
                <FontAwesomeIcon icon={faPlus} /> Registrar Comida
              </>
            )}
          </button>
        </div>
      </div>

      {showProductSelector && (
        <div className="modal-overlay" onClick={() => setShowProductSelector(false)}>
          <div className="modal-content product-selector-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Seleccionar Producto</h2>
            
            <div className="search-input-wrapper">
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>

            <div className="product-list">
              {filteredProducts.length === 0 ? (
                <div className="empty-message">No hay productos disponibles</div>
              ) : (
                filteredProducts.map((product) => (
                  <div 
                    key={product.id} 
                    className="product-item"
                    onClick={() => handleAddIngredient(product)}
                  >
                    <div className="product-info">
                      <span className="product-name">{product.name}</span>
                      <span className="product-provider">{product.provider?.name || 'Sin proveedor'}</span>
                    </div>
                    <div className="product-stock">
                      <span className="stock-label">Stock:</span>
                      <span className="stock-value">{product.quantity} {MEASURE_UNIT_LABELS[product.measureUnit as keyof typeof MEASURE_UNIT_LABELS] || product.measureUnit}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button onClick={() => setShowProductSelector(false)} className="btn-close-modal">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
