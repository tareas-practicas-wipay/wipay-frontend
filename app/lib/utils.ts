// "2026-10-20T11:32:08Z" -> "20/10/2026"
export function formatDate(isoDate: string) {
    return new Date(isoDate).toLocaleDateString('es-ES');
}