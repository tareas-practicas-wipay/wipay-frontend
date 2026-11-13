# wipay-frontend

Panel de administración de Wipay para gestionar **clientes** y sus **merchants**.

Es el frontend de [client-microservice](https://github.com/tareas-practicas-wipay/client-microservice) y [merchant-microservice](https://github.com/tareas-practicas-wipay/merchant-microservice): permite crear, buscar, ver, editar y borrar clientes y merchants.

## Stack

- Next.js: 14.2.35 (App Router)
- React: 18
- TypeScript: 5 (modo estricto)
- Tailwind CSS: 3.4, para la maquetación
- Ant Design: 6.7, para los componentes (con `@ant-design/nextjs-registry` y `@ant-design/icons`)
- use-debounce: 10.1, para buscar mientras se escribe

## Requisitos previos

- Node.js 18.17 o superior
- La infraestructura local levantada: ver [infraestructure](https://github.com/tareas-practicas-wipay/infraestructure)
- client-microservice arrancado en `http://localhost:8081`
- merchant-microservice arrancado en `http://localhost:8082`

## Variables de entorno

Se copian de `.env.example` a `.env.local` (este último no se sube al repositorio).

| Variable | Descripción | Valor en local |
|---|---|---|
| `CLIENT_SERVICE_URL` | URL de client-microservice | `http://localhost:8081` |
| `MERCHANT_SERVICE_URL` | URL de merchant-microservice | `http://localhost:8082` |

Si no existen, se usan esos mismos valores por defecto. Next las lee al arrancar, así que después de cambiarlas hay que reiniciar `npm run dev`.

## Arranque

```bash
npm install
cp .env.example .env.local
npm run dev
```

La aplicación arranca en **http://localhost:3000**.

Otros comandos:

| Comando | Para qué sirve |
|---|---|
| `npm run build` | Compilar para producción (con `npm run dev` parado, porque los dos usan la carpeta `.next`) |
| `npm start` | Arrancar la versión compilada |
| `npm run lint` | Revisar el código con ESLint |

## Funcionamiento

### Proxy hacia los microservicios

El navegador solo habla con Next (puerto 3000). Las peticiones a `/api/...` se reenvían al microservicio que toca con los `rewrites` de `next.config.mjs`:

| Ruta del frontend | Destino |
|---|---|
| `/api/tokens` | `CLIENT_SERVICE_URL/tokens` |
| `/api/clients/...` | `CLIENT_SERVICE_URL/clients/...` |
| `/api/merchants/...` | `MERCHANT_SERVICE_URL/merchants/...` |

Así no hace falta configurar CORS en el backend. Todas las llamadas están en `app/lib/data.ts`.

### Login y sesión

- En `/login` se escribe un nombre y una edad, y se genera un JWT con `POST /tokens` de client-microservice.
- Si la edad es menor de 18 se muestra un aviso y no se entra (el backend respondería `403` a todo).
- El token se guarda en el `localStorage` y se envía en el parámetro `token` de cada petición.
- La cabecera muestra el nombre, la edad y el tiempo que le queda al token. Al llegar a 0, o con el botón **Salir**, se cierra la sesión.
- Todas las páginas salvo el login están protegidas: sin un token válido se vuelve a `/login`. Si el backend responde `401`, también.

### Pantallas

| Ruta | Qué muestra |
|---|---|
| `/clients` | Tabla de clientes con búsqueda, y botones para crear, editar y borrar |
| `/clients/[id]` | Datos del cliente, sus merchants y botón para crearle un merchant |
| `/merchants` | Tabla de merchants con búsqueda, y botones para crear, editar y borrar |
| `/merchants/[id]` | Datos del merchant y su cliente propietario |

Crear y editar se hace en un panel lateral (Drawer) con las mismas validaciones que el backend.

### Búsquedas

Se elige el tipo de búsqueda en un desplegable y se guarda en la URL (por ejemplo `/clients?type=name&query=luc`), así que se mantiene al recargar.

- **Clientes**: todos, por id, por nombre o por email.
- **Merchants**: todos, por id, por nombre o por id de cliente.

La búsqueda por nombre se lanza mientras se escribe (espera 300 ms sin teclear). El resto se lanza al pulsar Enter o el botón de buscar.

### Borrado

El borrado es lógico (lo hace el backend): el registro deja de aparecer en las búsquedas. Un cliente con merchants activos no se puede borrar, así que en su detalle el botón **Borrar** aparece desactivado hasta que se borran sus merchants.

## Estructura

```
app/
├─ login/                  página de login
├─ (panel)/                páginas con menú lateral y cabecera (protegidas)
│  ├─ layout.tsx           protección de rutas + layout
│  ├─ clients/             tabla y detalle de clientes
│  └─ merchants/           tabla y detalle de merchants
├─ lib/
│  ├─ data.ts              llamadas al backend
│  ├─ definitions.ts       tipos (Client, Merchant...)
│  ├─ session.tsx          contexto de sesión y lectura del JWT
│  ├─ utils.ts             formato de fechas y nombres de los tipos de merchant
│  └─ validation.ts        expresiones regulares del backend
└─ ui/                     componentes (menú, perfil, buscador y Drawers)
```