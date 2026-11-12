import {Client, ClientForm, ClientSearchType, Merchant, MerchantForm, ProblemDetail} from '@/app/lib/definitions';
import { EMAIL_REGEX } from '@/app/lib/validation';
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

// ---------- Clientes ----------

export function fetchClients() {
    return request<Client[]>('/clients');
}

export function fetchClientById(id: string) {
    return request<Client>(`/clients/${encodeURIComponent(id)}`);
}

export function fetchClientsByName(name: string) {
    return request<Client[]>(`/clients/search/by-name?name=${encodeURIComponent(name)}`);
}

export function fetchClientByEmail(email: string) {
    return request<Client> (`/clients/search/by-email?email=${encodeURIComponent(email)}`);
}

export function deleteClient(id: string) {
    return request<void>(`/clients/${id}`, { method: 'DELETE' });
}

// ID y email devuelven UN cliente o un 404. Lo convertimos en lista: [cliente] o [] si no existe
async function oneOrNone(promise: Promise<Client>): Promise<Client[]> {
    try {
        return [await promise];
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
            return [];
        }
        throw error; // cualquier otro error sí se muestra
    }
}

// Decide a qué endpoint llamar según el tipo de búsqueda. Siempre devuelve una lista para la tabla
export function searchClients(type: ClientSearchType, query: string): Promise<Client[]> {
    const text = query.trim();
    if (type === 'all' || text === '') {
        return fetchClients();
    }
    if (type === 'name') {
        return fetchClientsByName(text);
    }
    if (type === 'id') {
        return oneOrNone(fetchClientById(text));
    }
    // Email: mientras no sea un email completo no llamamos (el backend respondería 400)
    if (!EMAIL_REGEX.test(text)) {
        return Promise.resolve([]);
    }
    return oneOrNone(fetchClientByEmail(text));
}

export function createClient(client: ClientForm) {
    return request<Client>('/clients', {
        method: 'POST',
        body: JSON.stringify(client),
    });
}

export function updateClient(id: string, client: ClientForm) {
    return request<Client>(`/clients/${id}`, {
       method: 'PUT',
       body: JSON.stringify(client),
    });
}

// ---------- Merchants ----------

export function fetchMerchantsByClient(clientId: string) {
    return request<Merchant[]>(`/merchants/search/by-client?clientId=${encodeURIComponent(clientId)}`);
}

export function createMerchant(merchant: MerchantForm) {
    return request<Merchant>('/merchants', {
        method: 'POST',
        body: JSON.stringify(merchant),
    });
}

// El propietario no se puede cambiar: MerchantUpdateRequest solo admite estos 3 campos
export function updateMerchant(id: string, merchant: MerchantForm) {
    const { name, address, merchantType } = merchant;
    return request<Merchant>(`/merchants/${id}`, {
        method: 'PUT',
        body: JSON.stringify({name, address, merchantType}),
    });
}