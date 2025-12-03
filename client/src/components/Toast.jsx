import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
} from "react";

const ToastContext = createContext(null);

let idSeq = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type, message, opts = {}) => {
    const id = idSeq++;
    const duration = opts.duration ?? 4000;
    setToasts((prev) => [...prev, { id, type, message, duration }]);
    return id;
  }, []);

  const api = useMemo(
    () => ({
      show: (type, message, opts) => push(type, message, opts),
      success: (msg, opts) => push("success", msg, opts),
      error: (msg, opts) => push("error", msg, opts),
      warn: (msg, opts) => push("warning", msg, opts),
      info: (msg, opts) => push("info", msg, opts),
      remove,
    }),
    [push, remove]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onRemove={remove} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

function ToastViewport({ toasts, onRemove }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-[90vw]">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => onRemove(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }) {
  useEffect(() => {
    if (toast.duration === 0) return; // sticky
    const id = setTimeout(onClose, toast.duration);
    return () => clearTimeout(id);
  }, [toast.duration, onClose]);

  const color =
    toast.type === "success"
      ? "bg-green-600"
      : toast.type === "error"
      ? "bg-red-600"
      : toast.type === "warning"
      ? "bg-yellow-600"
      : "bg-gray-800";

  return (
    <div
      className={`text-white ${color} px-3 py-2 rounded shadow flex items-start gap-2`}
    >
      <span className="mt-0.5 select-none">
        {toast.type === "success"
          ? "✓"
          : toast.type === "error"
          ? "⚠"
          : toast.type === "warning"
          ? "!"
          : "i"}
      </span>
      <div className="text-sm leading-5 flex-1">{toast.message}</div>
      <button onClick={onClose} className="text-white/80 hover:text-white">
        ×
      </button>
    </div>
  );
}
