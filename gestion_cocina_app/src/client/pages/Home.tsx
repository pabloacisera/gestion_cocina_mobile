import "../../css/home.css"
import { Link } from "react-router-dom"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAddressBook, faBoxOpen, faBoxesStacked } from '@fortawesome/free-solid-svg-icons'

export function Home() {
    return (
        <div className="home-container">
            <header className="header">
                <h1 className="brand-name">Administración</h1>
            </header>
            
            <main className="main-content">
                <Link to="/providers" className="menu-card">
                    <FontAwesomeIcon icon={faAddressBook} className="card-icon" />
                    <span className="card-text">Nuevo proveedor</span>
                </Link>

                <Link to="/products" className="menu-card">
                    <FontAwesomeIcon icon={faBoxOpen} className="card-icon" />
                    <span className="card-text">Nuevo insumo/producto</span>
                </Link>

                <Link to="/inventary" className="menu-card">
                    <FontAwesomeIcon icon={faBoxesStacked} className="card-icon" />
                    <span className="card-text">Listar inventario</span>
                </Link>
            </main>
        </div>
    )
}