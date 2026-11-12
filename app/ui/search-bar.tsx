'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Input, Select, Space } from 'antd';
import { useDebouncedCallback } from 'use-debounce';

const WAIT_BETWEEN_CHANGES = 300;

type SearchOption = {
    value: string;
    label: string;
    live?: boolean; // true = busca mientras escribes; sin él, busca al pulsar Enter o la lupa
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
    const { replace } = useRouter();
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
        replace(`${pathname}?${params.toString()}`);
    }

    // Debounce de 300 ms sin teclear antes de cambiar la URL
    const handleTyping = useDebouncedCallback((text: string) => {
        updateUrl(type, text);
    }, WAIT_BETWEEN_CHANGES);

    // Opción elegida: su texto (para el placeholder) y si busca mientras escribes
    const selected = options.find((option) => option.value === type);
    const label = selected?.label ?? '';
    const isLive = selected?.live ?? false;

    return (
        <Space.Compact style={{ width: '100%', maxWidth: 500 }}>
            <Select
                value={type}
                options={options}
                onChange={(newType) => {
                    handleTyping.cancel(); // si quedaba una búsqueda por nombre pendiente, la anulamos
                    updateUrl(newType, '');
                }}
                style={{ width: 140 }}
            />

            <Input.Search
                key={type}
                defaultValue={query}
                // Solo los tipos "live" buscan mientras escribes
                onChange={(event) => {
                    if (isLive) {
                        handleTyping(event.target.value);
                    }
                }}
                // Enter, la lupa o la ✕ (que envía '') buscan siempre, sea del tipo que sea
                onSearch={(value) => {
                    handleTyping.cancel();
                    updateUrl(type, value.trim());
                }}
                disabled={type === 'all'}
                placeholder={type === 'all' ? 'Mostrando todos' : `Buscar por ${label.toLowerCase()}`}
                enterButton
                allowClear
            />
        </Space.Compact>
    );
}