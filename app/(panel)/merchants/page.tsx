'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { App, Button, Popconfirm, Space, Table, Tag } from 'antd';
import type { TableProps } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Merchant, MerchantSearchType } from '@/app/lib/definitions';
import { deleteMerchant, searchMerchants} from '@/app/lib/data';
import { formatDate, MERCHANT_TYPE_LABELS } from '@/app/lib/utils';
import SearchBar from '@/app/ui/search-bar';
import MerchantDrawer from '@/app/ui/merchants/merchant-drawer';

// Opciones del desplegable
const searchOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'id', label: 'ID' },
    { value: 'name', label: 'Nombre' },
    { value: 'clientId', label: 'ID de cliente' },
];

export default function MerchantsPage() {
    // Búsqueda en la URL
    const searchParams = useSearchParams();
    const type = (searchParams.get('type') ?? 'all') as MerchantSearchType;
    const query = searchParams.get('query') ?? '';

    const { message } = App.useApp();
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [loading, setLoading] = useState(true);

    // Después de crear/editar, el useEffect vuelve a pedir la lista
    const [reloadKey, setReloadKey] = useState(0);

    // Drawer: si está abierto y qué merchant se edita (null = crear uno nuevo)
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);

    // Cada vez que cambia la URL, pedimos los merchants --> tipo, búsqueda o recarga de la tabla (p.ej en creación)
    useEffect(() => {
        // Si escribes rápido, puede llegar una respuesta antigua después de una nueva. (video de midudev)
        let ignore = false;

        async function load() {
            setLoading(true);
            try {
                const result = await searchMerchants(type, query);
                if (!ignore) {
                    setMerchants(result);
                }
            } catch (error) {
                if (!ignore) {
                    message.error(error instanceof Error ? error.message : 'Error inesperado');
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        }

        load();
        return () => {
            ignore = true;
        };
    }, [type, query, message, reloadKey]);

    function openCreate() {
        setEditingMerchant(null);
        setDrawerOpen(true);
    }

    function openEdit(merchant: Merchant) {
        setEditingMerchant(merchant);
        setDrawerOpen(true);
    }

    // Tras guardar: cerramos el Drawer y volvemos a pedir la lista
    function handleSaved() {
        setDrawerOpen(false);
        setReloadKey(reloadKey + 1);
    }

    // Popconfirm espera a que termine esta función para cerrar su botón de "cargando"
    async function handleDelete(merchant: Merchant) {
        try {
            await deleteMerchant(merchant.id);
            // Lo quitamos de la tabla sin volver a pedir la lista
            setMerchants(merchants.filter((m) => m.id !== merchant.id));
            message.success(`${merchant.name} se ha borrado`);
        } catch (error) {
            message.error(error instanceof Error ? error.message : 'Error inesperado');
        }
    }

    const columns: TableProps<Merchant>['columns'] = [
        {
            title: 'Nombre',
            key: 'name',
            render: (_, merchant) => <Link href={`/merchants/${merchant.id}`}>{merchant.name}</Link>,
        },
        { title: 'Dirección', dataIndex: 'address' },
        {
            title: 'Tipo',
            dataIndex: 'merchantType',
            render: (merchantType: Merchant['merchantType']) => <Tag>{MERCHANT_TYPE_LABELS[merchantType]}</Tag>,
        },
        {
            title: 'Cliente',
            dataIndex: 'clientId',
            // Solo los 8 primeros caracteres del id; el id completo aparece al pasar el ratón (title)
            render: (clientId: string) => (
                <Link href={`/clients/${clientId}`} title={clientId}>
                    {clientId.slice(0, 8)}…
                </Link>
            ),
        },
        { title: 'Alta', dataIndex: 'createdDate', render: (date: string) => formatDate(date) },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_, merchant) => (
                <Space>
                    <Button icon = { <EditOutlined /> } onClick={ () => openEdit(merchant)} />

                    <Popconfirm
                        title={`¿Borrar ${merchant.name}?`}
                        description="Dejará de aparecer en las búsquedas"
                        okText="Borrar"
                        okButtonProps={{ danger: true }}
                        placement="topRight"
                        onConfirm={() => handleDelete(merchant)}
                    >
                        <Button danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        },
    ];

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Merchants</h1>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                    Nuevo merchant
                </Button>
            </div>
            <SearchBar options={searchOptions} type={type} query={query} />
            <Table
                rowKey="id"
                columns={columns}
                dataSource={merchants}
                loading={loading}
                pagination={{ pageSize: 10 }}
                scroll={{ x: true }}
            />
            <MerchantDrawer
                open={drawerOpen}
                merchant={editingMerchant}
                onClose={() => setDrawerOpen(false)}
                onSaved={handleSaved}
            />
        </div>
    );
}