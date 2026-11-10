'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { SessionUser } from '@/app/lib/definitions';

// Clave con la que guardamos el token en el localStorage del navegador
const TOKEN_KEY = 'wipay-token';

// Lo que cualquier componente puede leer o hacer con la sesión
type Session = {
    token: string | null;       // el JWT tal cual, o null si no hay sesión
    user: SessionUser | null;   // nombre, edad y caducidad sacados del token
    ready: boolean;             // false hasta que hemos leído el localStorage
    login: (token: string) => void;
    logout: () => void;
};

const SessionContext = createContext<Session | null>(null);

/** Un JWT son tres partes separadas por puntos: cabecera.payload.firma
 *  El payload (la del medio) es un JSON con name, age, iat y exp.
 *  No verificamos la firma: no tenemos la clave secreta, y de eso ya se encarga el backend.
 */
export function decodeToken(token: string): SessionUser | null {
    try {
        const payload = token.split('.')[1];
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
        const data = JSON.parse(new TextDecoder().decode(bytes));
        return { name: data.name, age: data.age, exp: data.exp };
    } catch {
        // Si el token está mal formado, lo tratamos como "sin sesión"
        return null;
    }
}

// Envuelve la app y guarda el token.
export function SessionProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [ready, setReady] = useState(false);

    // Al abrir la app en el navegador, recuperamos el token guardado
    useEffect(() => {
        setToken(localStorage.getItem(TOKEN_KEY));
        setReady(true);
    }, []);

    function login(newToken: string) {
        localStorage.setItem(TOKEN_KEY, newToken); // para que sobreviva a recargar la página
        setToken(newToken);                        // para que React vuelva a pintar con la sesión
    }

    function logout() {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
    }

    // Los datos del usuario se calculan a partir del token en cada render
    const user = token ? decodeToken(token) : null;

    return (
        <SessionContext.Provider value={{ token, user, ready, login, logout }}>
            {children}
        </SessionContext.Provider>
    );
}

// Hook para leer la sesión desde cualquier componente: const { user, logout } = useSession();
export function useSession() {
    const session = useContext(SessionContext);
    if (!session) {
        throw new Error('useSession debe usarse dentro de <SessionProvider>');
    }
    return session;
}