import "../../../css/newProvider.css"
import React, { useState } from "react"
import { ProviderScheme, Provider } from "../../schemes/providerSchema"
import toast from "react-hot-toast"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCircleNotch } from "@fortawesome/free-solid-svg-icons"
import { userAuth } from "../../hooks/userAuth"
import { ApiService } from "../../services/ApiService";

export function NewProvider() {
    const { user } = userAuth();

    const [provider, setProvider] = useState<any>({
        name: "", cuit: "", address: ""
    })
    const [sending, setSending] = useState<boolean>(false)

    const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProvider({ ...provider, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e: React.SubmitEvent) => { // Mark as async
        e.preventDefault();
        setSending(true);

        const isValidate = ProviderScheme.safeParse(provider);

        if (!isValidate.success) {
            const flattened = isValidate.error.flatten();
            const errorMessages = [
                ...flattened.formErrors,
                ...Object.values(flattened.fieldErrors).flat()
            ];
            const error = errorMessages.length > 0
                ? `Faltan parametros o hay datos invalidos: ${errorMessages.join(", ")}`
                : "Faltan parametros o hay datos invalidos";
            toast.error(error, { id: "id-error" });
            setSending(false); // Ensure sending is false on validation error
            return;
        }

        if (!user) {
            toast.error("Debes iniciar sesión para crear un proveedor", { 
                id: "auth-required" 
            });
            setSending(false);
            return;
        }

        try {
            // Replace console.log with actual API call
            const response = await ApiService.post('/api/providers', provider);
            
            if (response.success) {
                toast.success("Proveedor creado exitosamente");
                resetForm(); // Reset form on successful creation
            } else {
                // If API returns success: false but no throw, display error from API
                toast.error(response.error || "Error al crear proveedor");
            }
        } catch (error: any) {
            // Error is already thrown by ApiService and potentially caught by toast
            // We can log it here or re-throw if needed, but toast handles user feedback
            console.error("Error creating provider:", error);
            // toast.error handles user feedback, but can add a generic one if needed
            // toast.error(error.message || "Error al crear proveedor");
        } finally {
            setSending(false); // Ensure sending state is reset
        }
    }

    const resetForm = () => {
        setProvider({ name: "", cuit: "", address: "" }); // Use default empty values
    }

    return (
        <div className="new-provider-form">
            <div className="form-container">
                <form className="form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="name">Nombre o empresa(*)</label>
                        <input type="text" name="name" id="name" value={provider.name} onChange={handleChangeInput} />
                    </div>
                    <div className="input-group">
                        <label htmlFor="cuit">CUIT</label>
                        <input type="text" name="cuit" id="cuit" value={provider.cuit} onChange={handleChangeInput} />
                    </div>
                    <div className="input-group">
                        <label htmlFor="address">Dirección</label>
                        <input type="text" name="address" id="address" value={provider.address} onChange={handleChangeInput} />
                    </div>
                    <span className="advise">Campos obligatorios(*)</span>
                    <div className="button-section">
                        {
                            sending ?
                                <span className="spinner">
                                    <FontAwesomeIcon icon={faCircleNotch} spin />
                                </span> :
                                <button type="submit" className="btn-save">Guardar</button>
                        }
                        <button type="button" className="btn-reset" onClick={resetForm}>Limpiar</button>
                    </div>
                </form>
            </div>
        </div>
    )
}