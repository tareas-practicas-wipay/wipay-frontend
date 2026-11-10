'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { App, Button, Card, Form, Input, InputNumber } from 'antd';
import { createToken } from '@/app/lib/data';
import { decodeToken, useSession } from '@/app/lib/session';

const MINIMUM_AGE = 18;

// Valores que devuelve el formulario al enviarlo
type LoginValues = {
    name: string;
    age: number;
};

export default function LoginPage() {
    const router = useRouter();
    const {message} = App.useApp();   // avisos flotantes con el tema de WiPay
    const {login} = useSession();
    const [loading, setLoading] = useState(false); // para el "cargando" del botón

    // Se ejecuta solo si el formulario pasa sus validaciones
    async function handleSubmit(values: LoginValues) {
        setLoading(true);
        try {
            const {token} = await createToken(values.name, values.age);

            // El backend da el token también a menores, pero luego responde 403 a todo.
            const user = decodeToken(token);
            if (!user || user.age < MINIMUM_AGE) {
                message.error(`Acceso restringido a mayores de ${MINIMUM_AGE} años`);
                return;
            }

            login(token);
            message.success(`Hola, ${user.name}`);
            router.replace('/clients');
        } catch (error) {
            message.error(error instanceof Error ? error.message : 'Error inesperado');
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-wipay-navy p-4">
            <Card className="w-full max-w-sm">
                <div className="flex justify-center mb-6">
                    <Image src="/wipay-logo.svg" alt="WiPay" width={180} height={51} priority />
                </div>

                <Form layout="vertical" onFinish={handleSubmit} requiredMark={false}>
                    <Form.Item
                        label="Nombre"
                        name="name"
                        rules={[{ required: true, whitespace: true, message: 'El nombre es obligatorio' }]}
                    >
                        <Input placeholder="Tu nombre" autoFocus />
                    </Form.Item>

                    <Form.Item
                        label="Edad"
                        name="age"
                        rules={[{ required: true, message: 'La edad es obligatoria' }]}
                    >
                        <InputNumber
                            min={0}
                            max={125}
                            precision={0}
                            placeholder="Tu edad"
                            style={{ width: '100%' }}
                        />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" block loading={loading}>
                        Entrar
                    </Button>
                </Form>
            </Card>
        </main>
    );
}