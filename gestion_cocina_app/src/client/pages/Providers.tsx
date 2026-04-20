import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAddressBook, faPlus, faEdit, faTrashAlt, faCircleNotch, faExclamationTriangle, faChevronLeft, faChevronRight, faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';

import { NewProvider } from '../components/home/NewProvider';
import { BackButton } from '../components/shared/BackButton';
import { ApiService } from '../services/ApiService';
import { Provider } from '../schemas/providerSchema';
import '../../css/providers.css';

// Define a more specific type for provider details if needed, otherwise use the imported Provider type
interface ProviderWithDetails extends Provider {
    // Add any additional fields if they exist in the API response
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export function Providers() {
    const navigate = useNavigate();
    const [providers, setProviders] = useState<ProviderWithDetails[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const [showNewProviderForm, setShowNewProviderForm] = useState<boolean>(false);
    const [editingProvider, setEditingProvider] = useState<ProviderWithDetails | null>(null);
    const [editFormData, setEditFormData] = useState({ name: '', cuit: '', address: '' });
    const [isEditing, setIsEditing] = useState<boolean>(false);

    const fetchProviders = async (page: number = 1) => {
        try {
            setLoading(true);
            setError(null);
            const response = await ApiService.get<{ success: boolean; data: ProviderWithDetails[]; pagination: Pagination }>(
                `/api/providers?page=${page}`
            );
            if (response.success) {
                setProviders(response.data);
                setPagination(response.pagination);
            } else {
                setError(response.error || 'Error al obtener los proveedores.');
            }
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error inesperado.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProviders();
    }, []);

    const handlePrevPage = () => {
        if (pagination.page > 1) {
            fetchProviders(pagination.page - 1);
        }
    };

    const handleNextPage = () => {
        if (pagination.page < pagination.totalPages) {
            fetchProviders(pagination.page + 1);
        }
    };

    const handleDeleteProvider = async (id: number, name: string) => {
        if (!window.confirm(`¿Estás seguro de que querés eliminar el proveedor "${name}"? Esta acción no se puede deshacer.`)) {
            return;
        }
        try {
            const response = await ApiService.delete(`/api/providers/${id}`);
            if (response.success) {
                toast.success(`Proveedor "${name}" eliminado correctamente.`);
                setProviders(providers.filter(p => p.id !== id)); // Remove from state
            } else {
                toast.error(response.error || `Error al eliminar el proveedor "${name}".`);
            }
        } catch (error: any) {
            toast.error(error.message || `Error al eliminar el proveedor "${name}".`);
            console.error("Error deleting provider:", error);
        }
    };

    const handleEditProvider = (provider: ProviderWithDetails) => {
        setEditingProvider(provider);
        setEditFormData({
            name: provider.name,
            cuit: provider.cuit || '',
            address: provider.address || ''
        });
        setIsEditing(true);
    };

    const handleSaveEdit = async () => {
        if (!editingProvider) return;
        
        try {
            const response = await ApiService.put(`/api/providers/${editingProvider.id}`, {
                name: editFormData.name,
                cuit: editFormData.cuit,
                address: editFormData.address
            });
            
            if (response.success) {
                toast.success(`Proveedor "${editFormData.name}" actualizado.`);
                setProviders(providers.map(p => 
                    p.id === editingProvider.id 
                        ? { ...p, name: editFormData.name, cuit: editFormData.cuit, address: editFormData.address }
                        : p
                ));
                setIsEditing(false);
                setEditingProvider(null);
            } else {
                toast.error(response.error || 'Error al actualizar proveedor.');
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al actualizar proveedor.');
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditingProvider(null);
        setEditFormData({ name: '', cuit: '', address: '' });
    };
    
    const toggleNewProviderForm = () => {
        setShowNewProviderForm(!showNewProviderForm);
    };

    return (
        <div className="providers-page">
            <header className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <BackButton />
                    <h1><FontAwesomeIcon icon={faAddressBook} /> Proveedores</h1>
                </div>
                <button onClick={toggleNewProviderForm} className="btn-add-new">
                    <FontAwesomeIcon icon={showNewProviderForm ? faAddressBook : faPlus} /> 
                    {showNewProviderForm ? "Ocultar" : "Nuevo"}
                </button>
            </header>

            {isEditing && editingProvider && (
                <div className="form-section">
                    <h2>Editar Proveedor</h2>
                    <div className="form-field">
                        <label>Nombre:</label>
                        <input
                            type="text"
                            value={editFormData.name}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-field">
                        <label>CUIT:</label>
                        <input
                            type="text"
                            value={editFormData.cuit}
                            onChange={(e) => setEditFormData({ ...editFormData, cuit: e.target.value })}
                        />
                    </div>
                    <div className="form-field">
                        <label>Dirección:</label>
                        <input
                            type="text"
                            value={editFormData.address}
                            onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                        />
                    </div>
                    <div className="form-actions">
                        <button onClick={handleCancelEdit} className="btn-secondary">Cancelar</button>
                        <button onClick={handleSaveEdit} className="btn-primary">Guardar</button>
                    </div>
                </div>
            )}

            {showNewProviderForm && !isEditing && (
                <div className="form-section">
                    <NewProvider onProviderCreated={fetchProviders} />
                </div>
            )}
            
            <div className="providers-list-section">
                 <h2>Proveedores Existentes</h2>
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
                {!loading && !error && providers.length === 0 && (
                    <div className="providers-empty">
                        No hay proveedores. Agrega uno usando el formulario.
                    </div>
                )}
                {!loading && !error && providers.length > 0 && (
                    <div className="providers-table-container">
                        <table className="providers-table">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>CUIT</th>
                                    <th>Dirección</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {providers.map((provider) => (
                                    <tr key={provider.id}>
                                        <td>{provider.name}</td>
                                        <td>{provider.cuit || 'N/A'}</td>
                                        <td>{provider.address || 'N/A'}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button onClick={() => navigate(`/products?providerId=${provider.id}`)} className="btn-edit" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                                                    <FontAwesomeIcon icon={faBoxOpen} /> Insumos
                                                </button>
                                                <button onClick={() => handleEditProvider(provider)} className="btn-edit">
                                                    <FontAwesomeIcon icon={faEdit} /> Editar
                                                </button>
                                                <button onClick={() => handleDeleteProvider(provider.id, provider.name)} className="btn-delete">
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
        </div>
    );
}

/*
// Basic CSS for Providers page (to be added to a CSS file, e.g., providers.css)
.providers-page-container {
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

.providers-list-section h2 {
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

.providers-table-container {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.providers-table-container table {
  width: 100%;
  border-collapse: collapse;
}

.providers-table-container th,
.providers-table-container td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.providers-table-container th {
  background-color: #f2f2f2;
  font-weight: bold;
  color: #555;
}

.providers-table-container tr:last-child td {
  border-bottom: none;
}

.providers-table-container td {
  color: #333;
}

.providers-table-container .actions {
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
*/
