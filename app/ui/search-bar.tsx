'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Input, Select, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useDebouncedCallback } from 'use-debounce';

const WAIT_BETWEEN_CHANGES = 300;

type SearchOption = {
    value: string;
    label: string;
};

// Desplegable con el tipo de búsqueda + caja de texto. Guarda los dos en la URL (?type=...&query=...)
export default function SearchBar({
                                      options,
                                      type,
                                      query,
                                  }: {
    options: SearchOption[];
    type: string;
    query: string;
}) {
    const router = useRouter();
    const pathname = usePathname();

    // Cambia la URL
    function updateUrl(newType: string, newQuery: string) {
        const params = new URLSearchParams();
        if (newType !== 'all') {
            params.set('type', newType);
        }
        if (newQuery) {
            params.set('query', newQuery);
        }
        router.replace(`${pathname}?${params.toString()}`);
    }

    // Debounce de 300 ms sin teclear antes de cambiar la URL
    const handleTyping = useDebouncedCallback((text: string) => {
        updateUrl(type, text);
    }, WAIT_BETWEEN_CHANGES);

    // Texto de la opción elegida, para el placeholder ("Buscar por nombre")
    const label = options.find((option) => option.value === type)?.label ?? '';

    return (
        <Space.Compact style={{ width: '100%', maxWidth: 576 }}>
            <Select
                value={type}
                options={options}
                onChange={(newType) => updateUrl(newType, '')}
                style={{ width: 120 }}
            />
            <Input
                key={type}
                defaultValue={query}
                onChange={(event) => handleTyping(event.target.value)}
                disabled={type === 'all'}
                placeholder={type === 'all' ? 'Mostrando todos' : `Buscar por ${label.toLowerCase()}`}
                prefix={<SearchOutlined />}
                allowClear
            />
        </Space.Compact>
    );
}