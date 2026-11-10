import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import esES from "antd/locale/es_ES";
import "./globals.css";

export const metadata: Metadata = {
  title: "WiPay Admin",
  description: "Gestión de clientes y merchants de WiPay",
};

// Colores de WiPay aplicados a todos los componentes de Ant Design
const theme = {
  token: {
    colorPrimary: "#0c2846",  // azul marino: botones principales, enlaces, foco
    colorSecundary: "#db1b43" // rosa oscuro : botones de borrar y mensajes de error
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
          {children}
        </ConfigProvider>
      </AntdRegistry>
      </body>
      </html>
  );
}
