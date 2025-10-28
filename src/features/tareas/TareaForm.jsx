import { useState } from "react";
import { createTarea } from "../../api/tareas";
import { useUsersOptions } from "../../hooks/useUsersOptions";
import SlackReminderFields from "./SlackReminderFields";
import { scheduleTaskReminder, testSlackMessage } from "../../api/flows";

export default function TareaForm({ clienteId = "", onSaved, org = 10 }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");
  const { options: userOpts } = useUsersOptions(org);

  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    cliente_id: clienteId || "",
    estado: "todo",
    vence_en: "",
    assignee: "",
  });
  const [slackCfg, setSlackCfg] = useState({ enable: false, channel: "#general", minutesBefore: 30 });

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess("");

    if (!form.titulo) return setError("Título obligatorio"), setLoading(false);

    try {
      const created = await createTarea(form, org); // BE devuelve { id, ... }
      const taskId = created?.id || created?.task_id;

      if (slackCfg.enable && form.vence_en) {
        try {
          await scheduleTaskReminder({
            taskId,
            title: form.titulo,
            dueISO: form.vence_en,
            channel: slackCfg.channel,
            minutesBefore: slackCfg.minutesBefore,
            assignee: form.assignee,
          });
        } catch (e) {
          console.warn("No se pudo agendar en Flows:", e);
        }
      }

      setSuccess("Tarea creada ✅");
      setForm({ titulo: "", descripcion: "", cliente_id: clienteId || "", estado: "todo", vence_en: "", assignee: "" });
      onSaved?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <h3 className="font-semibold">Nueva Tarea</h3>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-700">{success}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input name="titulo" value={form.titulo} onChange={onChange} placeholder="Título" className="border p-2 rounded" />
        <select name="estado" value={form.estado} onChange={onChange} className="border p-2 rounded">
          <option value="todo">To-do</option>
          <option value="doing">Doing</option>
          <option value="waiting">Waiting</option>
          <option value="done">Done</option>
        </select>
        <input name="cliente_id" value={form.cliente_id} onChange={onChange} placeholder="Cliente ID (opcional)" className="border p-2 rounded" />
        <input type="datetime-local" name="vence_en" value={form.vence_en} onChange={onChange} className="border p-2 rounded" />
        <select name="assignee" value={form.assignee} onChange={onChange} className="border p-2 rounded">
          <option value="">Asignado a (opcional)</option>
          {userOpts.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <textarea name="descripcion" value={form.descripcion} onChange={onChange} placeholder="Descripción" className="border p-2 rounded w-full min-h-[80px]" />

      <SlackReminderFields value={slackCfg} onChange={setSlackCfg} disabled={!form.vence_en} />

      <div className="flex gap-2">
        <button type="submit" className="px-3 py-2 bg-black text-white rounded" disabled={loading}>Crear</button>
        <button type="button" className="px-3 py-2 border rounded"
          onClick={() => testSlackMessage({ channel: slackCfg.channel, text: `Test Slack desde VEX CRM (${new Date().toLocaleTimeString()})` })}>
          Test Slack
        </button>
      </div>
    </form>
  );
}
