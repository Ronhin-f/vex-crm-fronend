import { X } from "lucide-react";

/**
 * SlideOver genérico (derecha). Cierra con ESC y al clickear el backdrop.
 * Props:
 * - open: bool
 * - onClose: fn
 * - title: string | node
 * - children
 * - widthClass: tailwind width (default w-[480px])
 */
export default function SlideOver({ open, onClose, title, children, widthClass = "w-[480px]" }) {
  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none select-none"}`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`absolute right-0 top-0 h-full bg-base-100 shadow-xl border-l border-base-200 ${widthClass}
                    transition-transform ${open ? "translate-x-0" : "translate-x-full"}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-base-200">
          <h3 className="font-semibold">{title}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto h-[calc(100%-3.25rem)]">{children}</div>
      </div>
    </div>
  );
}
