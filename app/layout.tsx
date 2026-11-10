import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
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
    colorPrimary: "#0c2846",  // azul marino: botones principales, enlaces, foco
    colorError: "#db1b43" // rosa oscuro : botones de borrar y mensajes de error
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
              <SessionProvider>{children}</SessionProvider>
          </ConfigProvider>
      </AntdRegistry>
      </body>
      </html>
  );
}
