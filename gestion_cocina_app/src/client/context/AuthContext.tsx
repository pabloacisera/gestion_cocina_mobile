import { createContext, useEffect, useState } from "react";
import { AuthService } from "../services/AuthService";

export const AuthContext = createContext<any>(null);

export const AuthProvider = (
    {children}:{children: React.ReactNode}
) => {
    const [ user, setUser ] = useState<any>(null);

    useEffect(()=> {
        const auth = AuthService.getStoredAuth();
        if(auth) {
            setUser(auth)
        } else {
            setUser(null);
            // toast.error("No esta logeado. Para disfrutar de las funcionalidades registre o ingrese.", { id: "xjifejini233feaw_weoivoi" })
        }
    }, [])

    return(
        <AuthContext.Provider value={ user }>
            { children }
        </AuthContext.Provider>
    )
}