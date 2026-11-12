'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { App, Button, Descriptions, Popconfirm, Result, Skeleton, Space, Table, Tag, Tooltip, Typography } from 'antd';
import type { TableProps } from 'antd';
import {DeleteOutlined, EditOutlined, PlusOutlined} from '@ant-design/icons';
import { Client, Merchant } from '@/app/lib/definitions';
import { deleteClient, fetchClientById, fetchMerchantsByClient } from '@/app/lib/data';
import { formatDate, formatDateTime, MERCHANT_TYPE_LABELS } from '@/app/lib/utils';
import ClientDrawer from '@/app/ui/clients/client-drawer';
import MerchantDrawer from "@/app/ui/merchants/merchant-drawer";

// Columnas de la tabla de merchants. Están fuera del componente porque no usan nada de él
const merchantColumns: TableProps<Merchant>['columns'] = [
    {
        title: 'Nombre',
        key: 'name',
        render: (_, merchant) => <Link href={`/merchants/${merchant.id}`}>{merchant.name}</Link>,
    },
    { title: 'Dirección', dataIndex: 'address' },
    {
        title: 'Tipo',
        dataIndex: 'merchantType',
        render: (type: Merchant['merchantType']) => <Tag>{MERCHANT_TYPE_LABELS[type]}</Tag>,
    },
    { title: 'Alta', dataIndex: 'createdDate', render: (date: string) => formatDate(date) },
];

export default function ClientDetailPage() {
    // id de la URL: /clients/506e75fd-... -> id = "506e75fd-..."
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { message } = App.useApp();

    const [client, setClient] = useState<Client | null>(null);
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const [merchantDrawerOpen, setMerchantDrawerOpen] = useState(false);

    useEffect(() => {
        let ignore = false;

        async function load() {
            setLoading(true);
            try {
                // Las dos peticiones a la vez: el cliente (8081) y sus merchants (8082)
                const [clientData, merchantsData] = await Promise.all([fetchClientById(id), fetchMerchantsByClient(id)]);
                if (!ignore) {
                    setClient(clientData);
                    setMerchants(merchantsData);
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
    }, [id, message]);

    // Mientras carga: un esqueleto gris con la forma aproximada de la página
    if (loading) {
        return <Skeleton active paragraph={{ rows: 10 }} />;
    }

    // Si no hay cliente (404, borrado o error), una página de "no encontrado"
    if (!client) {
        return (
            <Result
                status="404"
                title="Cliente no encontrado"
                subTitle="No existe, se ha borrado o no se ha podido cargar"
                extra={
                    <Link href="/clients">
                        <Button type="primary">Volver a clientes</Button>
                    </Link>
                }
            />
        );
    }

    // A partir de aquí TypeScript ya sabe que client no es null
    const hasMerchants = merchants.length > 0;

    async function handleDelete() {
        try {
            await deleteClient(id);
            message.success('Cliente borrado');
            router.push('/clients'); // el cliente ya no existe: volvemos a la lista
        } catch (error) {
            // Red de seguridad: si alguien añadió un merchant mientras tanto, llega el 409
            message.error(error instanceof Error ? error.message : 'Error inesperado');
        }
    }

    function handleSaved(saved: Client) {
        setClient(saved);
        setDrawerOpen(false);
    }

    async function handleMerchantSaved() {
        setMerchantDrawerOpen(false);
        try {
            setMerchants(await fetchMerchantsByClient(id));
        } catch (error) {
            message.error(error instanceof Error ? error.message : 'Error inesperado');
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-semibold">
                        {client.name} {client.surname}
                    </h1>
                    <Tag color={client.status === 'ACTIVE' ? 'green' : 'default'}>
                        {client.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                    </Tag>
                </div>
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => setDrawerOpen(true)}>
                        Editar
                    </Button>
                    {/* Con merchants no se puede borrar: botón desactivado y aviso al pasar el ratón */}
                    <Tooltip title={hasMerchants ? `Borra antes sus ${merchants.length} merchants` : ''}>
                        <span>
                            <Popconfirm
                                title={`¿Borrar a ${client.name} ${client.surname}?`}
                                description="Dejará de aparecer en las búsquedas"
                                okText="Borrar"
                                okButtonProps={{ danger: true }}
                                placement="bottomRight"
                                onConfirm={handleDelete}
                                disabled={hasMerchants}
                            >
                                <Button danger icon={<DeleteOutlined />} disabled={hasMerchants}>
                                    Borrar
                                </Button>
                            </Popconfirm>
                        </span>
                    </Tooltip>
                </Space>
            </div>

            {/* Los datos del cliente en una tabla de dos columnas: etiqueta | valor */}
            <Descriptions
                bordered
                column={1}
                size="small"
                items={[
                    { key: 'id', label: 'ID', children: <Typography.Text copyable>{client.id}</Typography.Text> },
                    { key: 'cifNifNie', label: 'CIF/NIF/NIE', children: client.cifNifNie },
                    { key: 'email', label: 'Email', children: client.email },
                    { key: 'phone', label: 'Tfno.', children: client.phone },
                    { key: 'createdDate', label: 'Alta', children: formatDateTime(client.createdDate) },
                ]}
            />

            <div className="flex flex-col gap-3">

                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Merchants ({merchants.length})</h2>

                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setMerchantDrawerOpen(true)}>
                        Nuevo merchant
                    </Button>
                </div>

                <Table
                    rowKey="id"
                    columns={merchantColumns}
                    dataSource={merchants}
                    pagination={false}
                    scroll={{ x: true }}
                    locale={{ emptyText: 'Este cliente aún no tiene merchants' }}
                />
            </div>

            <ClientDrawer open={drawerOpen} client={client} onClose={() => setDrawerOpen(false)} onSaved={handleSaved} />

            <MerchantDrawer
                open={merchantDrawerOpen}
                merchant={null}
                clientId={client.id}
                onClose={() => setMerchantDrawerOpen(false)}
                onSaved={handleMerchantSaved}
            />
        </div>
    );
}