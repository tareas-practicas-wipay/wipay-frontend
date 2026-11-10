import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App, ConfigProvider } from "antd";
import type { ThemeConfig } from "antd";
import esES from "antd/locale/es_ES";
import "./globals.css";
import { SessionProvider } from "@/app/lib/session";

export const metadata: Metadata = {
  title: "WiPay Admin",
  description: "Gestión de clientes y merchants de WiPay",
};

// Colores de WiPay aplicados a todos los componentes de Ant Design
const theme: ThemeConfig = {
    token: {
        colorPrimary: "#0c2846",
        colorError: "#db1b43",
    },
    // Colores de componentes concretos
    components: {
        Layout: {
            siderBg: "#0c2846",     // fondo del menú lateral
            triggerBg: "#081d33",   // barra inferior para plegarlo (un azul algo más oscuro)
            headerBg: "#ffffff",    // cabecera blanca
            headerPadding: "0 24px",
        },
        Menu: {
            darkItemBg: "#0c2846",          // fondo de las opciones
            darkItemSelectedBg: "#db1b43",  // opción seleccionada en rosa
        },
    },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="es">
      <body>
      <AntdRegistry>
          <ConfigProvider theme={theme} locale={esES}>
              <App>
                  <SessionProvider>{children}</SessionProvider>
              </App>
          </ConfigProvider>
      </AntdRegistry>
      </body>
      </html>
  );
}
