import "../../../css/newProvider.css"
import React, { useState } from "react"
import { ProviderScheme, Provider } from "../../schemes/providerSchema"
import toast from "react-hot-toast"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCircleNotch } from "@fortawesome/free-solid-svg-icons"
import { userAuth } from "../../hooks/userAuth"

export function NewProvider() {
    // tramos el hook de autenticación
    const { user } = userAuth();

    // inicializamos vacio
    const [provider, setProvider] = useState<any>({
        name: "", cuit: "", address: ""
    })
    const [sending, setSending] = useState<boolean>(false)

    // funcion para captura el name y su valor
    // para ello agregamos value={provider.name} y onChange={handleChangeInput}
    const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        // setea el value al name
        // para ello tenemos que pasarle el array original
        setProvider({ ...provider, [e.target.name]: e.target.value })
    }

    const handleSubmit = (e: React.SubmitEvent) => {
        e.preventDefault();

        setSending(true);

        // le pasamos el estado a zod para validar
        let isValidate = ProviderScheme.safeParse(provider);

        if (!isValidate.success) {
            const flattened = isValidate.error.flatten();

            // flattened.fieldErrors contiene errores por campo
            // flattened.formErrors contiene errores generales

            const errorMessages = [
                ...flattened.formErrors,
                ...Object.values(flattened.fieldErrors).flat()
            ];

            const error = errorMessages.length > 0
                ? `Faltan parametros o hay datos invalidos: ${errorMessages.join(", ")}`
                : "Faltan parametros o hay datos invalidos";

            toast.error(error, { id: "id-error" });
        }

                // ✅ Validación SIN llamar al hook aquí
        if (!user) {
            toast.error("Debes iniciar sesión para crear un proveedor", { 
                id: "auth-required" 
            });
            setSending(false)
            return;
        }

        // sino enviamos
        console.log("datos para enviar")

        setTimeout(() => {
            setSending(false)
        }, 1500)

    }

    const resetForm = () => {
        setProvider({ ...provider, name: "", cuit: "", address: "" })
    }

    return (
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
                                <FontAwesomeIcon icon={faCircleNotch} />
                            </span> :
                            <button type="submit" className="btn-save">guardar</button>
                    }
                    <button type="button" className="btn-reset" onClick={resetForm}>resetear</button>
                </div>
            </form>
        </div>
    )
}