// Mismas expresiones que ValidationPatterns.java del backend
export const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// NIF (12345678A), NIE (X1234567A) o CIF (B12345678)
export const CIF_NIF_NIE_REGEX = /^([0-9]{8}[A-Z]|[XYZ][0-9]{7}[A-Z]|[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J])$/;

// PHONE_REGEX: entre 9 y 15 dígitos, con + opcional
export const PHONE_REGEX = /^\+?\d{9,15}$/;