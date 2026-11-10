import { ProblemDetail } from '@/app/lib/definitions';
import { TOKEN_KEY } from '@/app/lib/session';

// Error que lanzamos cuando el backend responde con un código (400, 404, 409...).
export class ApiError extends Error {
    status: number;
    errors?: Record<string, string>;

    constructor(problem: ProblemDetail) {
        super(problem.detail); // el texto "detail" del backend pasa a ser error.message
        this.status = problem.status;
        this.errors = problem.errors;
    }
}

/**
 * Hace una petición al backend a través del proxy /api.
 * Añade el token, convierte los errores en ApiError y devuelve el JSON de la respuesta.
 * <T> es el tipo de lo que esperamos recibir (por ejemplo, Client[]).
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem(TOKEN_KEY) ?? '';
    // Si la ruta ya tiene parámetros (?name=...), el token se añade con &
    const separator = path.includes('?') ? '&' : '?';

    const response = await fetch(`/api${path}${separator}token=${token}`, {
        ...options,
        headers: { 'Content-Type': 'application/json' },
    });

    // 401: token caducado o inválido -> cerramos la sesión y vamos al login
    if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '/login';
    }

    if (!response.ok) {
        // Si el backend está caído, la respuesta no es JSON: creamos un error genérico
        const problem: ProblemDetail = await response.json().catch(() => ({
            status: response.status,
            title: 'Error',
            detail: 'No se ha podido conectar con el servidor',
        }));
        throw new ApiError(problem);
    }

    // 204 (borrados) no trae cuerpo: no hay JSON que leer
    if (response.status === 204) {
        return undefined as T;
    }
    return response.json();
}

// Genera un JWT de prueba (POST /tokens de client-microservice)
export function createToken(name: string, age: number): Promise<{token:string}> {
    return request<{token: string}>('/tokens', { method: 'POST', body:JSON.stringify({name, age}) });
}