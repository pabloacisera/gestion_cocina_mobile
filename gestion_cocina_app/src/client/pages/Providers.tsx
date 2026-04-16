import { NewProvider } from "../components/home/NewProvider";

export function Providers() {
    return (
        <>
            <header className="header">
                <h1 className="brand-name">Nuevo Proveedor</h1>
            </header>
           <div className="provider-container">
            <NewProvider />
           </div>
        </>
    )
}