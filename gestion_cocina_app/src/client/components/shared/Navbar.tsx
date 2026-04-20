import { Link, NavLink } from "react-router-dom";
import "../../../css/navbar.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// Importamos los iconos que necesites
import { faHouse, faChartBar, faCartShopping, faUser, faUtensils } from '@fortawesome/free-solid-svg-icons'; 

export const Navbar = () => {
    return (
        <nav className="mobile-navbar">
            <ul className="nav-list">
                <li className="nav-item">
                    <NavLink to="/home" className="nav-link">
                        <span className="icon">
                            <FontAwesomeIcon icon={faHouse} />
                        </span>
                        <span className="text">Inicio</span>
                    </NavLink>
                </li>
                <li className="nav-item">
                    <NavLink to="/report" className="nav-link">
                        <span className="icon">
                            <FontAwesomeIcon icon={faChartBar} />
                        </span>
                        <span className="text">Reporte</span>
                    </NavLink>
                </li>
                <li className="nav-item">
                    <NavLink to="/shopping" className="nav-link">
                        <span className="icon">
                            <FontAwesomeIcon icon={faCartShopping} />
                        </span>
                        <span className="text">Compras</span>
                    </NavLink>
                </li>

                {/* NEW LINK FOR MEALS */}
                <li className="nav-item">
                    <NavLink to="/meals" className="nav-link">
                        <span className="icon">
                            <FontAwesomeIcon icon={faUtensils} />
                        </span>
                        <span className="text">Comidas</span>
                    </NavLink>
                </li>

                <li className="nav-item">
                    <NavLink to="/profile" className="nav-link">
                        <span className="icon">
                            <FontAwesomeIcon icon={faUser} />
                        </span>
                        <span className="text">Perfil</span>
                    </NavLink>
                </li>

            </ul>
        </nav>
    );
};