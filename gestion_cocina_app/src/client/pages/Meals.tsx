import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUtensils, faPlus, faCircleNotch } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';

import { ApiService } from '../services/ApiService';
import { MealSchema, MealInput } from '../../server/schemas/mealSchema';
import { Product, MEASURE_UNIT_LABELS } from '../../server/schemas/productSchema';
import '../../css/meals.css';

// Define the structure for a meal with its ingredients and related product details
interface MealWithDetails {
  id: number;
  name: string;
  servedAt: string; // ISO string from backend
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

export function Meals() {
  const navigate = useNavigate();
  const [meals, setMeals] = useState<MealWithDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMeals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ApiService.get<{ success: boolean; data: MealWithDetails[] }>('/api/meals');
      if (response.success) {
        setMeals(response.data);
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

  const handleAddNewMeal = () => {
    navigate('/meals/new'); // Assuming a route for creating a new meal exists or will be created
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
    <div className="meals-page">
      <div className="meals-header">
        <h1><FontAwesomeIcon icon={faUtensils} /> Comidas</h1>
      </div>
      
      <div className="page-actions">
        <button onClick={handleAddNewMeal} className="btn-add-meal">
          <FontAwesomeIcon icon={faPlus} /> Nueva Comida
        </button>
      </div>

      {loading && (
        <div className="meals-loading">
          <FontAwesomeIcon icon={faCircleNotch} spin size="lg" />
          Cargando comidas...
        </div>
      )}

      {!loading && meals.length === 0 && (
        <div className="meals-empty">
          <p>No hay comidas registradas. Haz clic en "Nueva Comida" para crear una.</p>
        </div>
      )}

      {!loading && meals.length > 0 && (
        <div className="meals-table-container">
          <table className="meals-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Fecha</th>
                <th>Ingredientes</th>
              </tr>
            </thead>
            <tbody>
              {meals.map((meal) => (
                <tr key={meal.id}>
                  <td>{meal.name}</td>
                  <td>{formatCreatedAt(meal.servedAt)}</td>
                  <td>
                    <ul className="ingredient-list">
                      {meal.ingredients.map((ingredient) => (
                        <li key={ingredient.id}>
                          {ingredient.quantity} {MEASURE_UNIT_LABELS[ingredient.product?.measureUnit as keyof typeof MEASURE_UNIT_LABELS] || ingredient.product?.measureUnit || ''} - {ingredient.product?.name || 'Producto desconocido'}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
