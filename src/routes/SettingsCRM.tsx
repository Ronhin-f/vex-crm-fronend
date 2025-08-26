// Frontend/src/routes/SettingsCRM.tsx
import { useEffect, useState } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";

export default function SettingsCRM() {
  const [webhook, setWebhook] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/integraciones");
        setWebhook(data?.slack_webhook_url || "");
      } catch (e) {
        console.error("load integraciones", e);
      }
    })();
  }, []);

  const guardar = async () => {
    try {
      await api.put("/integraciones/slack", { slack_webhook_url: webhook });
      toast.success("Webhook guardado");
    } catch (e) {
      console.error("save webhook", e);
      toast.error("No se pudo guardar");
    }
  };

  const probar = async () => {
    try {
      const { data } = await api.post("/jobs/dispatch"); // forzamos un dispatch (si hay recordatorios pendientes)
      toast.success(`Dispatch OK: ${data?.ok || 0} enviados`);
    } catch (e) {
      console.error("test", e);
      toast.error("No se pudo probar");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">⚙️ Integraciones</h1>
      <div className="bg-white rounded-xl shadow p-4 space-y-3">
        <label className="text-sm text-gray-600">Slack Incoming Webhook</label>
        <input
          className="border rounded px-3 py-2 w-full"
          placeholder="https://hooks.slack.com/services/…"
          value={webhook}
          onChange={(e) => setWebhook(e.target.value)}
        />
        <div className="flex gap-2">
          <button className="bg-black text-white px-4 py-2 rounded" onClick={guardar}>Guardar</button>
          <button className="bg-gray-800 text-white px-4 py-2 rounded" onClick={probar}>Probar dispatch</button>
        </div>
        <p className="text-xs text-gray-500">
          Tip: el dispatch manda los recordatorios cuyo <code>enviar_en</code> sea ≤ ahora.
        </p>
      </div>
    </div>
  );
}
