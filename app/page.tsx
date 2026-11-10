import { redirect } from 'next/navigation';

// La raíz no tiene contenido propio: siempre lleva a Clientes
export default function Page() {
    redirect('/clients');
}