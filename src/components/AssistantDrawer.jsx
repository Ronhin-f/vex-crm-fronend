import React, { useMemo, useRef, useState } from "react";
import { coreApi } from "../utils/api";

const INITIAL_MESSAGES = [
  {
    id: "welcome",
    from: "assistant",
    type: "message",
    text: "Hola, soy VEX Assistant. Decime que necesitas.",
  },
];

const makeId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
};

function buildEntityContext(pathname = "") {
  const parts = pathname.split("/").filter(Boolean);
  if (!parts.length) return {};

  const last = parts[parts.length - 1];
  const id = Number(last);
  if (!Number.isFinite(id)) return {};

  const prev = parts[parts.length - 2] || "";
  if (prev.includes("tareas")) return { taskId: id };
  if (prev.includes("clientes")) return { leadId: id };
  return { entityId: id };
}

function resolveCoreBase() {
  const env = (typeof import.meta !== "undefined" && import.meta.env) ? import.meta.env : {};
  const fromEnv = env.VITE_API_CORE_URL || env.VITE_CORE_API_URL || "";
  const fromCfg = coreApi?.defaults?.baseURL || "";
  const raw = (fromCfg || fromEnv || "https://vex-core-backend-production.up.railway.app").trim();
  return raw.replace(/\/+$/, "");
}

function readTokenFromHash() {
  if (typeof window === "undefined") return "";
  const hash = window.location.hash || "";
  const qIndex = hash.indexOf("?");
  if (qIndex === -1) return "";
  const qs = hash.slice(qIndex + 1);
  const params = new URLSearchParams(qs);
  return params.get("vex_token") || params.get("token") || "";
}

function ensureToken() {
  try {
    const token =
      localStorage.getItem("vex_token") ||
      localStorage.getItem("token") ||
      "";
    if (token) return token;
    const hashToken = readTokenFromHash();
    if (hashToken) {
      localStorage.setItem("vex_token", hashToken);
      return hashToken;
    }
  } catch {}
  return "";
}

const labelFromKey = (key) => {
  const cleaned = String(key || "").replace(/_/g, " ").trim();
  if (!cleaned) return "Dato";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

export default function AssistantDrawer() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState(null);
  const [lastDebug, setLastDebug] = useState(null);
  const listRef = useRef(null);

  const currentRoute = useMemo(
    () => (typeof window !== "undefined" ? window.location.pathname : "/"),
    []
  );
  const entityContext = useMemo(() => buildEntityContext(currentRoute), [currentRoute]);
  const userLocale =
    (typeof navigator !== "undefined" && navigator.language) || "es-AR";

  const debugEnabled = useMemo(() => {
    const env = (typeof import.meta !== "undefined" && import.meta.env) ? import.meta.env : {};
    return String(env.VITE_ASSISTANT_DEBUG || env.VITE_DEBUG_ASSISTANT || "") === "1";
  }, []);

  const pushMessage = (msg) => {
    setMessages((prev) => [...prev, { id: makeId(), ...msg }]);
    setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    }, 50);
  };

  const sendMessage = async ({ text, confirmToken } = {}) => {
    const messageText = (text ?? input).trim();
    if (!messageText && !confirmToken) return;

    if (messageText) {
      pushMessage({ from: "user", type: "message", text: messageText });
    }
    setInput("");
    setLoading(true);

    try {
      const token = ensureToken();
      if (!token) {
        pushMessage({
          from: "assistant",
          type: "error",
          text: "Necesito que inicies sesion desde Vex Core para poder ayudarte.",
        });
        return;
      }

      const payload = {
        message: messageText || undefined,
        confirm_token: confirmToken || undefined,
        currentModule: "crm",
        currentRoute,
        entityContext,
        userLocale,
      };

      if (debugEnabled) {
        setLastDebug({ request: payload, response: null });
      }

      const res = await fetch(`${resolveCoreBase()}/assistant/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...(debugEnabled ? { "x-assistant-debug": "1" } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("assistant_error");
      const data = await res.json();

      if (data?.type === "action_preview") {
        setPendingConfirm(data.confirm_token);
      } else {
        setPendingConfirm(null);
      }

      if (debugEnabled) {
        setLastDebug((prev) => ({
          request: prev?.request || payload,
          response: data,
        }));
      }

      pushMessage({
        from: "assistant",
        type: data.type || "message",
        text: data.text || "Listo.",
        payload: data,
      });
    } catch (err) {
      pushMessage({
        from: "assistant",
        type: "error",
        text: "No pude procesar eso ahora. Probamos de nuevo?",
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmAction = () => {
    if (!pendingConfirm) return;
    sendMessage({ confirmToken: pendingConfirm });
  };

  const renderItems = (items = []) => {
    if (!items.length) return null;
    return (
      <ul className="mt-2 text-sm space-y-1">
        {items.slice(0, 5).map((item, idx) => (
          <li key={`${item?.id || idx}`} className="opacity-80">
            - {item.title || item.nombre || `Item #${item?.id || idx + 1}`}
          </li>
        ))}
      </ul>
    );
  };

  const renderSteps = (steps = []) => {
    if (!steps?.length) return null;
    return (
      <ol className="mt-2 text-sm list-decimal list-inside space-y-1">
        {steps.map((s, i) => (
          <li key={`${s}-${i}`} className="opacity-80">
            {s}
          </li>
        ))}
      </ol>
    );
  };

  const renderPreview = (preview = {}) => {
    if (!preview || typeof preview !== "object") return null;
    const entries = Object.entries(preview).filter(([, value]) => {
      if (value === null || value === undefined) return false;
      const text = String(value).trim();
      return text.length > 0;
    });
    if (!entries.length) return null;
    return (
      <div className="mt-2 text-xs bg-base-300/40 p-2 rounded space-y-1">
        {entries.slice(0, 6).map(([key, value]) => (
          <div key={key} className="flex gap-2">
            <span className="opacity-70">{labelFromKey(key)}:</span>
            <span className="font-medium">{String(value)}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderDebug = () => {
    if (!debugEnabled || !lastDebug) return null;
    return (
      <div className="mt-3 text-xs bg-base-200 p-2 rounded">
        <div className="font-semibold mb-1">Debug</div>
        <pre className="whitespace-pre-wrap">{JSON.stringify(lastDebug, null, 2)}</pre>
      </div>
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn btn-primary fixed bottom-6 right-6 shadow-lg z-50"
      >
        Asistente
      </button>

      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-base-100 shadow-2xl z-40 transform transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-base-200">
          <div>
            <h3 className="font-semibold">VEX Assistant</h3>
            <p className="text-xs opacity-60">Respuestas cortas, cero humo.</p>
          </div>
          <button className="btn btn-sm btn-ghost" onClick={() => setOpen(false)}>
            Cerrar
          </button>
        </div>

        <div ref={listRef} className="p-4 overflow-y-auto h-[70vh] space-y-3">
          {messages.map((msg) => {
            const isUser = msg.from === "user";
            const payload = msg.payload || {};
            return (
              <div
                key={msg.id}
                className={`p-3 rounded-lg text-sm ${
                  isUser ? "bg-primary text-primary-content ml-8" : "bg-base-200 mr-8"
                }`}
              >
                <p>{msg.text}</p>
                {payload?.type === "summary" && renderItems(payload.items)}
                {payload?.type === "action_preview" && renderPreview(payload.payload_preview)}
                {payload?.type === "action_preview" && renderSteps(payload.steps)}
                {payload?.type === "action_result" && renderPreview(payload.result)}
                {payload?.deep_link && (
                  <button
                    type="button"
                    className="btn btn-xs btn-outline mt-2"
                    onClick={() => (window.location.href = payload.deep_link)}
                  >
                    Ir a ...
                  </button>
                )}
                {payload?.type === "action_preview" && pendingConfirm === payload?.confirm_token && (
                  <button
                    type="button"
                    className="btn btn-xs btn-primary mt-2 ml-2"
                    onClick={confirmAction}
                  >
                    Confirmar accion
                  </button>
                )}
              </div>
            );
          })}
          {loading && (
            <div className="text-xs opacity-60">Procesando...</div>
          )}
        </div>

        <div className="p-4 border-t border-base-200">
          <div className="flex gap-2">
            <input
              className="input input-bordered flex-1"
              placeholder="Escribi tu pedido..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage({});
              }}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => sendMessage({})}
              disabled={loading}
            >
              Enviar
            </button>
          </div>
          {pendingConfirm && (
            <div className="text-xs opacity-70 mt-2">
              Tenes una accion pendiente de confirmar.
            </div>
          )}
          {renderDebug()}
        </div>
      </div>
    </>
  );
}
