import {
    Client,
    ClientForm,
    ClientSearchType,
    Merchant,
    MerchantForm,
    MerchantSearchType,
    ProblemDetail
} from '@/app/lib/definitions';
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

/**
 * Si el backend responde 404 (no existe), devolvemos una lista vacía en lugar de un error.
 * Sirve para CLIENT y MERCHANT --> (<T> = el tipo de los elementos)
 */
async function emptyIfNotFound<T>(promise: Promise<T[]>): Promise<T[]> {
    try {
        return await promise;
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
            return [];
        }
        throw error;
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
        return emptyIfNotFound(fetchClientById(text).then((client) => [client]));
    }
    // Email: mientras no sea un email completo no llamamos (el backend respondería 400)
    if (!EMAIL_REGEX.test(text)) {
        return Promise.resolve([]);
    }
    return emptyIfNotFound(fetchClientByEmail(text).then((client) => [client]));
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

export function deleteClient(id: string) {
    return request<void>(`/clients/${id}`, { method: 'DELETE' });
}

// ---------- Merchants ----------

export function fetchMerchants() {
    return request<Merchant[]>('/merchants');
}

export function fetchMerchantById(id: string) {
    return request<Merchant>(`/merchants/${encodeURIComponent(id)}`);
}

export function fetchMerchantsByName(name: string) {
    return request<Merchant[]>(`/merchants/search/by-name?name=${encodeURIComponent(name)}`);
}

export function fetchMerchantsByClient(clientId: string) {
    return request<Merchant[]>(`/merchants/search/by-client?clientId=${encodeURIComponent(clientId)}`);
}

// Decide a qué endpoint llamar según el tipo de búsqueda. Siempre devuelve una lista para la tabla
export function searchMerchants(type: MerchantSearchType, query: string): Promise<Merchant[]> {
    const text = query.trim();
    if (type === 'all' || text === '') {
        return fetchMerchants();
    }
    if (type === 'name') {
        return fetchMerchantsByName(text);
    }
    if (type === 'id') {
        return emptyIfNotFound(fetchMerchantById(text).then((merchant) => [merchant]));
    }
    // clientId: mientras el id no esté completo, el backend responde 404 -> lista vacía
    return emptyIfNotFound(fetchMerchantsByClient(text));
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

export function deleteMerchant(id: string) {
    return request<void>(`/merchants/${id}`, { method: 'DELETE' });
}

