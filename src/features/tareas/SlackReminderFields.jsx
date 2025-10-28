import { useEffect, useState } from "react";
import { flowsHealth } from "../../api/flows";

export default function SlackReminderFields({ value, onChange, disabled }) {
  const [flowsOk, setFlowsOk] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let m = true;
    flowsHealth()
      .then(() => m && setFlowsOk(true))
      .catch(() => m && setFlowsOk(false))
      .finally(() => m && setChecking(false));
    return () => { m = false; };
  }, []);

  const v = value || { enable: false, channel: "#general", minutesBefore: 30 };

  return (
    <fieldset className="border rounded p-3">
      <legend className="px-1 text-sm font-medium">Recordatorio Slack</legend>
      {checking ? (
        <p className="text-xs text-gray-500">Chequeando Flows…</p>
      ) : flowsOk ? (
        <p className="text-xs text-green-700">Flows online ✅</p>
      ) : (
        <p className="text-xs text-amber-700">Flows no disponible. Podés guardar la tarea; el recordatorio no se enviará.</p>
      )}

      <div className="mt-2 flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!v.enable}
          onChange={(e)=>onChange({ ...v, enable: e.target.checked })}
          disabled={disabled}
        />
        <span className="text-sm">Activar recordatorio por Slack</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
        <input
          className="border p-2 rounded"
          placeholder="#canal o @usuario"
          value={v.channel}
          onChange={(e)=>onChange({ ...v, channel: e.target.value })}
          disabled={disabled || !v.enable}
        />
        <input
          type="number"
          min={1}
          className="border p-2 rounded"
          placeholder="Min. antes"
          value={v.minutesBefore}
          onChange={(e)=>onChange({ ...v, minutesBefore: Number(e.target.value||0) })}
          disabled={disabled || !v.enable}
        />
        <span className="text-xs text-gray-600 self-center">Se agenda antes del vencimiento</span>
      </div>
    </fieldset>
  );
}
