// src/components/perfil/PerfilUsuarioCard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { coreApi } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { usePerfilUsuario } from "../../hooks/usePerfilUsuario";

const baseState = { nombre: "", apellido: "", avatar_url: "", phone: "" };

export default function PerfilUsuarioCard() {
  const { usuario } = useAuth();
  const { perfil, loading, refresh, setPerfil } = usePerfilUsuario();
  const [form, setForm] = useState(baseState);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (perfil) {
      setForm({
        nombre: perfil.nombre || "",
        apellido: perfil.apellido || "",
        avatar_url: perfil.avatar_url || "",
        phone: perfil.phone || "",
      });
    }
  }, [perfil]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e?.preventDefault();
    if (!usuario?.email) return toast.error("No hay usuario en sesion");
    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre || undefined,
        apellido: form.apellido || undefined,
        avatar_url: form.avatar_url || undefined,
        phone: form.phone || undefined,
      };
      const { data } = await coreApi.put(
        `/perfil/usuarios/${encodeURIComponent(usuario.email)}`,
        payload
      );
      if (data?.perfil) {
        setPerfil?.(data.perfil);
        toast.success("Perfil actualizado");
      } else {
        toast.success("Guardado");
      }
      refresh();
    } catch (err) {
      const msg = err?.response?.data?.error || "No se pudo actualizar el perfil";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-1 text-sm text-base-content">
          <span>Nombre</span>
          <input
            name="nombre"
            value={form.nombre}
            onChange={onChange}
            className="input input-bordered w-full"
            placeholder="Tu nombre"
            disabled={saving}
          />
        </label>

        <label className="space-y-1 text-sm text-base-content">
          <span>Apellido</span>
          <input
            name="apellido"
            value={form.apellido}
            onChange={onChange}
            className="input input-bordered w-full"
            placeholder="Tu apellido"
            disabled={saving}
          />
        </label>

        <label className="space-y-1 text-sm text-base-content">
          <span>Avatar URL (https)</span>
          <input
            name="avatar_url"
            value={form.avatar_url}
            onChange={onChange}
            className="input input-bordered w-full"
            placeholder="https://..."
            disabled={saving}
          />
        </label>

        <label className="space-y-1 text-sm text-base-content">
          <span>Telefono</span>
          <input
            name="phone"
            value={form.phone}
            onChange={onChange}
            className="input input-bordered w-full"
            placeholder="+54 9 ..."
            disabled={saving}
          />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" className="btn btn-primary btn-sm md:btn-md" disabled={saving}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
        <button type="button" onClick={refresh} className="btn btn-ghost btn-sm" disabled={loading || saving}>
          Recargar
        </button>
        <button
          type="button"
          onClick={() => navigate("/area")}
          className="btn btn-outline btn-sm md:btn-md gap-2"
        >
          Configurar area/vertical
        </button>
        {perfil?.updated_at && (
          <span className="text-xs text-base-content/60">
            Ultima edicion: {new Date(perfil.updated_at).toLocaleString()}
          </span>
        )}
      </div>
    </form>
  );
}
