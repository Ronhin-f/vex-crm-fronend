// src/components/perfil/PerfilModal.jsx
import React from "react";
import PerfilUsuarioCard from "./PerfilUsuarioCard";

export default function PerfilModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-3xl w-full mx-4 border border-base-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-base-200">
          <div>
            <p className="text-xs uppercase tracking-wide text-base-content/60">Tu cuenta</p>
            <h3 className="text-xl font-bold text-base-content">Perfil</h3>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            aria-label="Cerrar modal"
            type="button"
          >
            ✕
          </button>
        </div>
        <div className="p-5">
          <PerfilUsuarioCard />
        </div>
      </div>
    </div>
  );
}
