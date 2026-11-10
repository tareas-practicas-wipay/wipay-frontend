import { Button } from "antd";

export default function Page() {
  return (
      <main className="p-6 flex gap-4">
        <Button type="primary">Botón principal</Button>
        <Button danger>Borrar</Button>
      </main>
  );
}