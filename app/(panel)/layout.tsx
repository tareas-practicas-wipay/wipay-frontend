'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layout, Spin } from 'antd';
import { useSession } from '@/app/lib/session';
import SideNav from '@/app/ui/side-nav';
import UserProfile from '@/app/ui/user-profile';

// Layout de todas las pantallas excepto el login.
export default function PanelLayout({ children }: { children: React.ReactNode }) {
    const { replace } = useRouter();
    const { user, ready } = useSession();

    const isLoggedIn = user !== null && user.exp * 1000 > Date.now();

    useEffect(() => {
        // Solo decidimos cuando ya se ha leído el localStorage (ready)
        if (ready && !isLoggedIn) {
            replace('/login');
        }
    }, [ready, isLoggedIn, replace]);

    // Mientras se lee la sesión, o justo antes de redirigir, mostramos una rueda de cargando
    if (!isLoggedIn) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <SideNav />
            <Layout>
                <Layout.Header>
                    <UserProfile />
                </Layout.Header>
                <Layout.Content className="p-6">{children}</Layout.Content>
            </Layout>
        </Layout>
    );
}