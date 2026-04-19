import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUtensils, faPlus, faCircleNotch, faExclamationTriangle, faTrash, faChevronDown, faChevronUp, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';

import { ApiService } from '../services/ApiService';
import { BackButton } from '../components/shared/BackButton';
import { MEASURE_UNIT_LABELS } from '../../server/schemas/productSchema';
import '../../css/meals-list.css';

interface MealWithDetails {
  id: number;
  name: string;
  servedAt: string;
  createdAt: string;
  ingredients: Array<{
    id: number;
    mealId: number;
    productId: number;
    quantity: number;
    product: {
      id: number;
      name: string;
      measureUnit: string;
      provider: {
        id: number;
        name: string;
      } | null;
    } | null;
  }>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function MealsList() {
  const navigate = useNavigate();
  const [meals, setMeals] = useState<MealWithDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [expandedMeal, setExpandedMeal] = useState<number | null>(null);

  const fetchMeals = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await ApiService.get<{ success: boolean; data: MealWithDetails[]; pagination: Pagination }>(
        `/api/meals?page=${page}`
      );
      if (response.success) {
        setMeals(response.data);
        setPagination(response.pagination);
      } else {
        setError(response.error || 'Failed to fetch meals.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeals();
  }, []);

  const handlePrevPage = () => {
    if (pagination.page > 1) {
      fetchMeals(pagination.page - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      fetchMeals(pagination.page + 1);
    }
  };

  const handleAddNewMeal = () => {
    navigate('/meals/new'); // Navigate to the new meal creation route
  };

  const formatCreatedAt = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateString;
    }
  };

  const toggleMeal = (mealId: number) => {
    setExpandedMeal(expandedMeal === mealId ? null : mealId);
  };

  const handleDeleteMeal = async (mealId: number, mealName: string) => {
    if (!window.confirm(`¿Eliminar "${mealName}"? Esto no descuenta stock.`)) return;
    
    try {
      const response = await ApiService.delete(`/api/meals/${mealId}`);
      if (response.success) {
        toast.success('Comida eliminada');
        setMeals(meals.filter(m => m.id !== mealId));
      } else {
        toast.error(response.error || 'Error al eliminar');
      }
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  return (
    <div className="meals-list-page">
      <header className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BackButton />
          <h1><FontAwesomeIcon icon={faUtensils} /> Comidas</h1>
        </div>
        <button onClick={handleAddNewMeal} className="btn-add-new">
          <FontAwesomeIcon icon={faPlus} /> Nueva
        </button>
      </header>

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

      {!loading && !error && meals.length === 0 && (
        <div className="meals-empty">
          No hay comidas registradas.
        </div>
      )}

      {!loading && !error && meals.length > 0 && (
        <div className="meals-list">
          {meals.map((meal) => (
            <div key={meal.id} className={`meal-card ${expandedMeal === meal.id ? 'expanded' : ''}`}>
              <div className="meal-header" onClick={() => toggleMeal(meal.id)}>
                <div className="meal-info">
                  <h3>{meal.name}</h3>
                  <span className="meal-date">{formatCreatedAt(meal.servedAt)}</span>
                </div>
                <div className="meal-actions">
                  <button 
                    className="btn-delete-meal"
                    onClick={(e) => { e.stopPropagation(); handleDeleteMeal(meal.id, meal.name); }}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                  <FontAwesomeIcon 
                    icon={expandedMeal === meal.id ? faChevronUp : faChevronDown} 
                    className="expand-icon"
                  />
                </div>
              </div>
              {expandedMeal === meal.id && (
                <div className="meal-ingredients">
                  <h4>Ingredientes utilizados:</h4>
                  <ul>
                    {meal.ingredients.map((ing) => (
                      <li key={ing.id}>
                        <span className="ing-qty">{ing.quantity} {MEASURE_UNIT_LABELS[ing.product?.measureUnit as keyof typeof MEASURE_UNIT_LABELS] || ing.product?.measureUnit}</span>
                        <span className="ing-name">{ing.product?.name || 'Desconocido'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
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
