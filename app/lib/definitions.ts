// Tipos de los datos que intercambiamos con el backend.
// Copiados a mano de los DTO de Java (ClientResponse, MerchantResponse...).

export type EntityStatus = 'ACTIVE' | 'INACTIVE';

export type Client = {
    id: string;
    name: string;
    surname: string;
    cifNifNie: string;
    phone: string;
    email: string;
    status: EntityStatus;
    createdDate: string; // fecha, por ej: "2026-10-20T11:32:08Z"
};

// Lo que se envía al crear o editar un cliente (POST y PUT /clients)
export type ClientForm = Omit<Client, 'id' | 'status' | 'createdDate'>;

export type MerchantType =
    | 'MERCHANT_TYPE_PERSONAL_SERVICES'
    | 'MERCHANT_TYPE_FINANCIAL_SERVICES'
    | 'MERCHANT_TYPE_RETAIL'
    | 'MERCHANT_TYPE_ECOMMERCE'
    | 'MERCHANT_TYPE_OTHER';


export type Merchant = {
    id: string;
    clientId: string;
    name: string;
    address: string;
    merchantType: MerchantType;
    status: EntityStatus;
    createdDate: string; // fecha, por ej: "2026-10-20T11:32:08Z"
};

export type MerchantForm = Omit<Merchant, 'id' | 'status' | 'createdDate'>;

// Persona que ha iniciado sesión, leída del JWT
export type SessionUser = {
    name: string;
    age: number;
    exp: number; // caducidad
};

// Formato de los errores del backend (ProblemDetail de Spring)
export type ProblemDetail = {
    status: number;
    title: string;
    detail: string;
    errors?: Record<string, string>; // solo en los 400: nombre del campo -> mensaje
};