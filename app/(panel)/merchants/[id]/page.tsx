'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Alert, App, Button, Card, Descriptions, Popconfirm, Result, Skeleton, Space, Tag, Typography } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined} from '@ant-design/icons';
import { Client, Merchant } from '@/app/lib/definitions';
import { deleteMerchant, fetchClientById, fetchMerchantById } from '@/app/lib/data';
import { formatDateTime, MERCHANT_TYPE_LABELS } from '@/app/lib/utils';
import MerchantDrawer from '@/app/ui/merchants/merchant-drawer';

export default function MerchantDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { message } = App.useApp();

    const [merchant, setMerchant] = useState<Merchant | null>(null);
    const [loading, setLoading] = useState(true);

    // El propietario se carga aparte: si client-microservice falla, el resto de la página sigue funcionando
    const [owner, setOwner] = useState<Client | null>(null);
    const [ownerError, setOwnerError] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Carga el merchant
    useEffect(() => {
        let ignore = false;

        async function load() {
            setLoading(true);
            try {
                // Petición del merchant
                const result = await fetchMerchantById(id);

                if (!ignore) {
                    setMerchant(result);
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

    // El propietario depende del merchant: hasta que no tenemos su clientId no se puede pedir
    const ownerId = merchant?.clientId;

    useEffect(() => {
        if (!ownerId) {
            return; // aún no ha cargado el merchant
        }
        let ignore = false;

        async function loadOwner(clientId: string) {
            setOwnerError(false);
            try {
                const result = await fetchClientById(clientId);
                if (!ignore) {
                    setOwner(result);
                }
            } catch {
                // client-microservice caído, cliente borrado...: la tarjeta mostrará un aviso en su lugar
                if (!ignore) {
                    setOwnerError(true);
                }
            }
        }

        loadOwner(ownerId);
        return () => {
            ignore = true;
        };
    }, [ownerId]);

    if (loading) {
        return <Skeleton active paragraph={{ rows: 8 }} />;
    }

    if (!merchant) {
        return (
            <Result
                status="404"
                title="Merchant no encontrado"
                subTitle="No existe, se ha borrado o no se ha podido cargar"
                extra={
                    <Link href="/merchants">
                        <Button type="primary">Volver a merchants</Button>
                    </Link>
                }
            />
        );
    }

    async function handleDelete() {
        try {
            await deleteMerchant(id);
            message.success('Merchant borrado');
            router.push(`/clients/${ownerId}`); // ya no existe: redirigimos al cliente propietario

            /// OTRA OPCIÓN --> También podriamos volver a /merchants

        } catch (error) {
            message.error(error instanceof Error ? error.message : 'Error inesperado');
        }
    }

    // Guardar en el estado y cerrar el Drawer
    function handleSaved(saved: Merchant) {
        setMerchant(saved);
        setDrawerOpen(false);
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Cabecera: nombre, tipo y acciones */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-semibold">{merchant.name}</h1>
                    <Tag>{MERCHANT_TYPE_LABELS[merchant.merchantType]}</Tag>
                </div>
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => setDrawerOpen(true)}>
                        Editar
                    </Button>
                    <Popconfirm
                        title={`¿Borrar ${merchant.name}?`}
                        description="Dejará de aparecer en las búsquedas"
                        okText="Borrar"
                        okButtonProps={{ danger: true }}
                        placement="bottomRight"
                        onConfirm={handleDelete}
                    >
                        <Button danger icon={<DeleteOutlined />}>
                            Borrar
                        </Button>
                    </Popconfirm>
                </Space>
            </div>

            {/* Los datos del merchant */}
            <Descriptions
                bordered
                column={1}
                size="small"
                items={[
                    { key: 'id', label: 'ID', children: <Typography.Text copyable>{merchant.id}</Typography.Text> },
                    { key: 'address', label: 'Dirección', children: merchant.address },
                    { key: 'merchantType', label: 'Tipo', children: MERCHANT_TYPE_LABELS[merchant.merchantType] },
                    {
                        key: 'status',
                        label: 'Estado',
                        children: (
                            <Tag color={merchant.status === 'ACTIVE' ? 'green' : 'default'}>
                                {merchant.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                            </Tag>
                        ),
                    },
                    { key: 'createdDate', label: 'Alta', children: formatDateTime(merchant.createdDate) },
                ]}
            />

            {/* Cliente propietario: tarjeta aparte con nombre, email y botón para ir a su detalle */}
            <Card
                title="Cliente propietario"
                extra={
                    <Link href={`/clients/${merchant.clientId}`}>
                        <Button type="primary" icon={<EyeOutlined />}>
                            Ver cliente
                        </Button>
                    </Link>
                }
            >
                {ownerError && <Alert type="warning" showIcon title="No se ha podido cargar el cliente propietario" />}
                {!ownerError && !owner && <Skeleton active title={false} paragraph={{ rows: 2 }} />}
                {owner && (
                    <div className="flex flex-col">
                        <span className="font-medium">
                            {owner.name} {owner.surname}
                        </span>
                        <span className="text-gray-500">{owner.email}</span>
                    </div>
                )}
            </Card>

            <MerchantDrawer open={drawerOpen} merchant={merchant} onClose={() => setDrawerOpen(false)} onSaved={handleSaved} />
        </div>
    );
}
