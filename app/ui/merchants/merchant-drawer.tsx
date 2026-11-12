'use client';

import { useEffect, useState } from 'react';
import { App, Button, Drawer, Form, Input, Select, Space } from 'antd';
import { useDebouncedCallback } from 'use-debounce';
import { Client, Merchant, MerchantForm } from '@/app/lib/definitions';
import { ApiError, createMerchant, fetchClientById, fetchClientsByName, updateMerchant } from '@/app/lib/data';
import { MERCHANT_TYPE_LABELS } from '@/app/lib/utils';

const WAIT_BETWEEN_CHANGES = 300;

// Opciones del desplegable de tipo
const merchantTypeOptions = Object.entries(MERCHANT_TYPE_LABELS).map(([value, label]) => ({ value, label }));

// Un cliente convertido en opción del desplegable: se guarda su id y se ve su nombre y email
function toClientOption(client: Client) {
    return { value: client.id, label: `${client.name} ${client.surname} · ${client.email}` };
}

/**
 * Panel lateral con el formulario de merchant.
 * Se reutiliza tanto para CREAR como para EDITAR:
 * merchant = null -> crear | merchant con datos -> editar.
 *
 * clientId (opcional) -> crear un merchant para ese cliente, con el propietario ya puesto y bloqueado
  */
export default function MerchantDrawer({
                                           open,
                                           merchant,
                                           clientId,
                                           onClose,
                                           onSaved,
                                       }: {
    open: boolean;
    merchant: Merchant | null;
    clientId?: string;
    onClose: () => void;
    onSaved: (merchant: Merchant) => void;
}) {
    const [form] = Form.useForm<MerchantForm>();
    const { message } = App.useApp();
    const [saving, setSaving] = useState(false);
    // Opciones del desplegable de propietario (resultados de la búsqueda)
    const [clientOptions, setClientOptions] = useState<{ value: string; label: string }[]>([]);
    const [searching, setSearching] = useState(false);

    const isEditing = merchant !== null;
    // El propietario no se puede elegir al editar (el backend no lo permite) ni si ya viene dado
    const ownerLocked = isEditing || clientId !== undefined;

    useEffect(() => {
        if (!open) {
            return;
        }
        form.resetFields();
        setClientOptions([]);

        if (merchant) {
            form.setFieldsValue(merchant);   // editar: todos sus datos
        } else if (clientId) {
            form.setFieldsValue({ clientId }); // crear para un cliente: solo el propietario
        }

        // Si ya sabemos quién es el propietario, lo pedimos para que el desplegable muestre su nombre y no el id
        const ownerId = merchant?.clientId ?? clientId;
        if (ownerId) {
            fetchClientById(ownerId)
                .then((owner) => setClientOptions([toClientOption(owner)]))
                .catch(() => setClientOptions([]));
        }
    }, [open, merchant, clientId, form]);

    // Igual que en la barra de búsqueda: espera 300 ms sin teclear antes de llamar al backend
    const handleClientSearch = useDebouncedCallback(async (text: string) => {
        if (text.trim() === '') {
            setClientOptions([]);
            return;
        }
        setSearching(true);
        try {
            const clients = await fetchClientsByName(text.trim());
            setClientOptions(clients.map(toClientOption));
        } catch (error) {
            message.error(error instanceof Error ? error.message : 'Error inesperado');
        } finally {
            setSearching(false);
        }
    }, WAIT_BETWEEN_CHANGES);

    async function handleSubmit(values: MerchantForm) {
        setSaving(true);
        try {
            const saved = merchant ? await updateMerchant(merchant.id, values) : await createMerchant(values);
            message.success(merchant ? 'Merchant actualizado' : 'Merchant creado');
            onSaved(saved);
        } catch (error) {

            if (error instanceof ApiError && error.status === 422) {
                // El cliente ya no existe (p. ej: ha sido borrado mientras se editaba)
                form.setFields([{ name: 'clientId', errors: [error.message] }]);
            } else if (error instanceof ApiError && error.errors) {
                form.setFields(
                    Object.entries(error.errors).map(([field, text]) => ({ name: field as keyof MerchantForm, errors: [text] })),
                );
            } else {
                // Por ejemplo 503: client-microservice no responde
                message.error(error instanceof Error ? error.message : 'Error inesperado');
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <Drawer
            title={isEditing ? 'Editar merchant' : 'Nuevo merchant'}
            open={open}
            onClose={onClose}
            forceRender
            size={480}
        >
            <Form form={form} layout="vertical" validateTrigger="onBlur" onFinish={handleSubmit}>
                <Form.Item
                    label="Cliente propietario"
                    name="clientId"
                    extra={isEditing ? 'El propietario de un merchant no se puede cambiar' : undefined}
                    rules={[{ required: true, message: 'El id del cliente es obligatorio' }]}
                >
                    <Select
                        showSearch={{ filterOption: false, onSearch: handleClientSearch }}
                        options={clientOptions}
                        loading={searching}
                        disabled={ownerLocked}
                        placeholder="Escribe parte del nombre del cliente"
                        notFoundContent={searching ? 'Buscando...' : 'Escribe para buscar clientes por nombre'}
                    />
                </Form.Item>

                <Form.Item
                    label="Nombre"
                    name="name"
                    rules={[{ required: true, whitespace: true, message: 'El nombre es obligatorio' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Dirección"
                    name="address"
                    rules = {[
                        { required: true, whitespace: true, message: 'La dirección es obligatoria' }
                    ]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Tipo"
                    name="merchantType"
                    rules={[{ required: true, message: 'El tipo de merchant es obligatorio' }]}
                >
                    <Select options={merchantTypeOptions} placeholder="Elige un tipo" />
                </Form.Item>

                <Space>
                    <Button onClick={onClose}>Cancelar</Button>
                    <Button type="primary" htmlType="submit" loading={saving}>
                        {isEditing ? 'Guardar cambios' : 'Crear merchant'}
                    </Button>
                </Space>
            </Form>
        </Drawer>
    );
}