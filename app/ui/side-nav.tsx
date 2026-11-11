'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layout, Menu } from 'antd';
import { ShopOutlined, TeamOutlined } from '@ant-design/icons';

const links = [
    { key: '/clients', icon: <TeamOutlined />, label: <Link href="/clients">Clientes</Link> },
    { key: '/merchants', icon: <ShopOutlined />, label: <Link href='/merchants'>Merchants</Link> }
];

export default function SideNav() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    // Marcamos la opción cuya ruta es el principio de la actual (así /clients/123 también marca "Clientes")
    const selectedKey = links.find((link) => pathname.startsWith(link.key))?.key ?? '';

    return (
        <Layout.Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} breakpoint="lg">
            <Link href="/clients" className="flex h-16 items-center justify-center">
                {collapsed ? (
                    <Image src="/wipay-isotipo-negativo.svg" alt="WiPay" width={32} height={32} />
                ) : (
                    <Image src="/wipay-logo-negativo.svg" alt="WiPay" width={144} height={40} priority />
                )}
            </Link>
            <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]} items={links} />
        </Layout.Sider>
    );
}