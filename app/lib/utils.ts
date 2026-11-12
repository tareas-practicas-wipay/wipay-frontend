import {MerchantType} from "@/app/lib/definitions";

// "2026-10-20T11:32:08Z" -> "20/10/2026"
export function formatDate(isoDate: string) {
    return new Date(isoDate).toLocaleDateString('es-ES');
}

// "2026-10-20T11:32:08Z" -> "20/10/26, 13:32" (en la hora del ordenador del cliente)
export function formatDateTime(isoDate: string) {
    return new Date(isoDate).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
}

// Texto en español de cada tipo de merchant
export const MERCHANT_TYPE_LABELS: Record<MerchantType, string> = {
    MERCHANT_TYPE_PERSONAL_SERVICES: 'Servicios personales',
    MERCHANT_TYPE_FINANCIAL_SERVICES: 'Servicios financieros',
    MERCHANT_TYPE_ECOMMERCE: 'Comercio online',
    MERCHANT_TYPE_RETAIL: 'Comercio minorista',
    MERCHANT_TYPE_OTHER: 'Otros',
};