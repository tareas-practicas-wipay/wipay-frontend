'use client';

import { useEffect, useState } from 'react';
import { App, Avatar, Button, Tag } from 'antd';
import { ClockCircleOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { useSession } from '@/app/lib/session';

// Convierte segundos en "mm:ss" (por ejemplo, 3130 -> "52:10")
function formatTime(totalSeconds: number) {
    const minutos = Math.floor(totalSeconds/60);
    const segundos = totalSeconds % 60;

    return `${minutos}:${String(segundos).padStart(2,'0')}`;
}

export default function UserProfile() {
    const { user, logout } = useSession();
    const { message } = App.useApp();
    const [now, setNow] = useState(Date.now());

    // Cada segundo vuelve a pintar la hora
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval); // al salir de la página, paramos el reloj
    }, []);

    const secondsLeft = user ? Math.max(0, Math.floor(user.exp - now / 1000)) : 0;

    // Cuando llega a 0: avisamos y cerramos la sesión (el layout nos llevará al login)
    useEffect(() => {
        if (secondsLeft === 0) {
            message.warning('Tu sesión ha caducado');
            logout();
        }
    }, [secondsLeft, message, logout]);

    if (!user) {
        return null;
    }

    return (
        <div className="flex h-full items-center justify-end gap-3">
            <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#0c2846' }} />
            <span className="font-medium">{user.name}</span>
            <span className="hidden text-gray-500 sm:inline">{user.age} años</span>
            <Tag icon={<ClockCircleOutlined />} color={secondsLeft < 300 ? 'error' : 'default'}>
                {formatTime(secondsLeft)}
            </Tag>
            <Button icon={<LogoutOutlined />} onClick={logout}>
                Salir
            </Button>
        </div>
    );
}