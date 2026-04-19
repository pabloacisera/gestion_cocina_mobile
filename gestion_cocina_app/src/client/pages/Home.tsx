import "../../css/home.css"
import { Link, useNavigate } from "react-router-dom"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAddressBook, faBoxOpen, faBoxesStacked, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'
import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/ApiService';
import { useAuth } from '../context/AuthContext';

interface InventoryAlertResponse {
  success: boolean;
  data: any[];
  count: number;
}

export function Home() {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [alertCount, setAlertCount] = useState<number>(0);
    const [loadingAlerts, setLoadingAlerts] = useState<boolean>(true);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
            return;
        }

        const fetchAlerts = async () => {
            try {
                setLoadingAlerts(true);
                const response = await ApiService.get<InventoryAlertResponse>('/api/inventory/alerts');
                if (response.success) {
                    setAlertCount(response.count);
                }
            } catch (error) {
                console.error("Error fetching alerts:", error);
            } finally {
                setLoadingAlerts(false);
            }
        };

        fetchAlerts();
    }, [user, authLoading, navigate]);

    const handleMenuClick = (e: React.MouseEvent, path: string) => {
        e.preventDefault();
        console.log('[Home] Navigating to:', path);
        navigate(path);
    };

    return (
        <div className="home-container">
            <header className="header">
                <h1 className="brand-name">Administración</h1>
            </header>
            
            {/* Alert Banner */}
            {!loadingAlerts && alertCount > 0 && (
                <div onClick={(e) => handleMenuClick(e, '/inventary')} className="alert-banner" style={{ cursor: 'pointer' }}>
                    <FontAwesomeIcon icon={faExclamationTriangle} color="red" />
                    <span>⚠️ Atención: Tienes {alertCount} producto(s) con stock crítico</span>
                </div>
            )}

            <main className="main-content">
                <div onClick={(e) => handleMenuClick(e, '/providers')} className="menu-card" style={{ cursor: 'pointer' }}>
                    <FontAwesomeIcon icon={faAddressBook} className="card-icon" />
                    <span className="card-text">Nuevo proveedor</span>
                </div>

                <div onClick={(e) => handleMenuClick(e, '/products')} className="menu-card" style={{ cursor: 'pointer' }}>
                    <FontAwesomeIcon icon={faBoxOpen} className="card-icon" />
                    <span className="card-text">Nuevo insumo/producto</span>
                </div>

                <div onClick={(e) => handleMenuClick(e, '/inventary')} className="menu-card" style={{ cursor: 'pointer' }}>
                    <FontAwesomeIcon icon={faBoxesStacked} className="card-icon" />
                    <span className="card-text">Listar inventario</span>
                </div>
            </main>
        </div>
    )
}

// Add some basic CSS for the alert banner (to be placed in home.css or a global CSS file)
/*
.alert-banner {
    display: flex;
    align-items: center;
    gap: 10px;
    background-color: #fff0f0; // Light red background
    color: #ff4d4f; // Red text
    padding: 10px 20px;
    margin: 15px 20px;
    border-radius: 5px;
    text-decoration: none;
    border: 1px solid #ff4d4f;
    transition: background-color 0.3s ease;
}

.alert-banner:hover {
    background-color: #ffe6e6;
}

.alert-banner span {
    font-weight: bold;
}
*/
