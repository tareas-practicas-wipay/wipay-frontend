'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { App, Button, Popconfirm, Table } from 'antd';
import type { TableProps } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { Client, ClientSearchType } from '@/app/lib/definitions';
import { deleteClient, searchClients } from '@/app/lib/data';
import { formatDate } from '@/app/lib/utils';
import SearchBar from '@/app/ui/search-bar';

// Opciones del desplegable
const searchOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'id', label: 'ID' },
    { value: 'name', label: 'Nombre' },
    { value: 'email', label: 'Email' },
];

export default function ClientsPage() {
    // Búsqueda en la URL
    const searchParams = useSearchParams();
    const type = (searchParams.get('type') ?? 'all') as ClientSearchType;
    const query = searchParams.get('query') ?? '';

    const { message } = App.useApp();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);

    // Cada vez que cambia la búsqueda (la URL), pedimos los clientes
    useEffect(() => {
        // Si escribes rápido, puede llegar una respuesta antigua después de una nueva. (video de midudev)
        let ignore = false;

        async function load() {
            setLoading(true);
            try {
                const result = await searchClients(type, query);
                if (!ignore) {
                    setClients(result);
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
    }, [type, query, message]);

    // Popconfirm espera a que termine esta función para cerrar su botón de "cargando"
    async function handleDelete(client: Client) {
        try {
            await deleteClient(client.id);
            // Lo quitamos de la tabla sin volver a pedir la lista
            setClients(clients.filter((c) => c.id !== client.id));
            message.success(`${client.name} ${client.surname} se ha borrado`);
        } catch (error) {
            // Por ejemplo, 409: "No se puede borrar el cliente ... porque tiene merchants activos"
            message.error(error instanceof Error ? error.message : 'Error inesperado');
        }
    }

    // Columnas de la tabla
    const columns: TableProps<Client>['columns'] = [
        {
            title: 'Nombre',
            key: 'name',
            render: (_, client) => (
                <Link href={`/clients/${client.id}`}>
                    {client.name} {client.surname}
                </Link>
            ),
        },
        { title: 'CIF/NIF/NIE', dataIndex: 'cifNifNie' },
        { title: 'Email', dataIndex: 'email' },
        { title: 'Tfno.', dataIndex: 'phone' },
        { title: 'Alta', dataIndex: 'createdDate', render: (date: string) => formatDate(date) },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_, client) => (
                <Popconfirm
                    title={`¿Borrar a ${client.name} ${client.surname}?`}
                    description="Dejará de aparecer en las búsquedas"
                    okText="Borrar"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => handleDelete(client)}
                >
                    <Button danger icon={<DeleteOutlined />} />
                </Popconfirm>
            ),
        },
    ];

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold">Clientes</h1>
            <SearchBar options={searchOptions} type={type} query={query} />
            <Table
                rowKey="id"
                columns={columns}
                dataSource={clients}
                loading={loading}
                pagination={{ pageSize: 10 }}
                scroll={{ x: true }}
            />
        </div>
    );
}