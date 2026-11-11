'use client';

import { useEffect, useState } from 'react';
import { App, Button, Drawer, Form, Input, Space } from 'antd';
import { Client, ClientForm } from '@/app/lib/definitions';
import { ApiError, createClient, updateClient } from '@/app/lib/data';
import { CIF_NIF_NIE_REGEX, EMAIL_REGEX, PHONE_REGEX } from '@/app/lib/validation';

/**Panel lateral con el formulario de cliente.
 * Se reutiliza tanto para CREAR como para EDITAR:
 * client = null -> crear | client con datos -> editar ese cliente
 */

export default function ClientDrawer({
                                         open,
                                         client,
                                         onClose,
                                         onSaved,
                                     }: {
    open: boolean;
    client: Client | null;
    onClose: () => void;
    onSaved: (client: Client) => void;
}) {

    const [form] = Form.useForm<ClientForm>();
    const { message } = App.useApp();
    const [saving, setSaving] = useState(false);

    const isEditing = client !== null;

    // Cada vez que se abre: se vacía (valores y errores anteriores) y, si editamos, se rellena con el cliente
    useEffect(() => {
        if (open) {
            form.resetFields();
            if (client) {
                form.setFieldsValue(client);
            }
        }
    }, [open, client, form]);

    async function handleSubmit(values: ClientForm) {
        setSaving(true);
        try {
            // Con cliente -> PUT; sin cliente -> POST
            const saved =
                client
                ? await updateClient(client.id, values)
                : await createClient(values);
            message.success(client ? 'Cliente actualizado' : 'Cliente creado');
            onSaved(saved);
        } catch (error) {
            if (error instanceof ApiError && error.status === 409) {
                // Email repetido: el error se muestra debajo del campo Email
                form.setFields([{ name: 'email', errors: [error.message] }]);
            } else if (error instanceof ApiError && error.errors) {
                // 400 del backend: { campo: mensaje } -> cada error debajo de su campo
                form.setFields(
                    Object.entries(error.errors).map(([field, text]) => ({ name: field as keyof ClientForm, errors: [text] })),
                );
            } else {
                message.error(error instanceof Error ? error.message : 'Error inesperado');
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <Drawer
            title={isEditing ? 'Editar cliente' : 'Nuevo cliente'}
            open={open}
            onClose={onClose}
            forceRender
            size={480}
        >
            <Form form={form} layout="vertical" validateTrigger="onBlur" onFinish={handleSubmit}>
                <Form.Item
                    label="Nombre"
                    name="name"
                    rules={[{ required: true, whitespace: true, message: 'El nombre es obligatorio' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Apellidos"
                    name="surname"
                    rules={[{ required: true, whitespace: true, message: 'Los apellidos son obligatorios' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="CIF / NIF / NIE"
                    name="cifNifNie"
                    extra="Ejemplos: 12345678A, X1234567A o B12345678"
                    normalize={(value: string) => value.toUpperCase()}
                    rules={[
                        { required: true, message: 'El CIF/NIF/NIE es obligatorio' },
                        { pattern: CIF_NIF_NIE_REGEX, message: 'El CIF/NIF/NIE no tiene un formato válido' },
                    ]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Tfno."
                    name="phone"
                    extra="Entre 9 y 15 dígitos, con + opcional"
                    rules={[
                        { required: true, message: 'El teléfono es obligatorio' },
                        { pattern: PHONE_REGEX, message: 'El teléfono no tiene un formato válido' },
                    ]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                        { required: true, message: 'El email es obligatorio' },
                        { pattern: EMAIL_REGEX, message: 'El email no tiene un formato válido' },
                    ]}
                >
                    <Input/>
                </Form.Item>

                <Space>
                    <Button onClick={onClose}>Cancelar</Button>
                    <Button type="primary" htmlType="submit" loading={saving}>
                        {isEditing ? 'Guardar cambios' : 'Crear cliente'}
                    </Button>
                </Space>
            </Form>
        </Drawer>
    );
}