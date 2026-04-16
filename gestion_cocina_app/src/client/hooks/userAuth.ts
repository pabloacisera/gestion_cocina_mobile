// hooks/userAuth.ts
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";

export const userAuth = () => {  // ✅ Convención: "useAuth" en lugar de "userAuth"
    const auth = useContext(AuthContext);
    
    const checkAuth = () => {
        if (!auth) {
            toast.error("El usuario no esta autenticado.", {
                id: `custom-id-${Date.now()}`
            });
            return false;
        }
        return true;
    };
    
    return { user: auth, checkAuth }; // ✅ Retorna el usuario y una función de verificación
};