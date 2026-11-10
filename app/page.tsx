'use client';

import { Button } from 'antd';
import { useSession } from '@/app/lib/session';

export default function Page() {
    const { user, ready } = useSession();

    return (
        <main className="p-6 flex flex-col gap-4">
            <p>
                {!ready && 'Leyendo sesión...'}
                {ready && !user && 'Sin sesión'}
                {ready && user && `Hola, ${user.name} (${user.age} años). Caduca a las ${new Date(user.exp * 1000).toLocaleTimeString()}`}
            </p>
            <div className="flex gap-4">
                <Button type="primary">Botón principal</Button>
                <Button danger>Borrar</Button>
            </div>
        </main>
    );
}