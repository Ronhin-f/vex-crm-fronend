import { flows, unwrapFlows } from "../lib/flows";

// Healthcheck (para mostrar si Flows está online)
export const flowsHealth = () => unwrapFlows(flows.get("/health"));

// Emitir triggers a Flows
export const flowsEmit = (trigger, payload) =>
  unwrapFlows(flows.post("/api/triggers/emit", { trigger, payload }));

// Agendar recordatorio de tarea en Slack: due - minutesBefore
export function scheduleTaskReminder({ taskId, title, dueISO, channel, minutesBefore = 15, assignee }) {
  if (!dueISO) return Promise.reject({ message: "No hay fecha de vencimiento" });
  const when = new Date(new Date(dueISO).getTime() - minutesBefore * 60_000).toISOString();
  const text = `⏰ Recordatorio: "${title}" asignada a ${assignee || "(sin asignar)"} vence ${new Date(dueISO).toLocaleString()}`;
  const payload = { channel, text, schedule_at: when, meta: { taskId, dueISO, minutesBefore, assignee, title } };
  return flowsEmit("task.reminder.slack", payload);
}

// Mensaje de prueba inmediato a Slack
export const testSlackMessage = ({ channel, text }) =>
  flowsEmit("slack.message", { channel, text });
