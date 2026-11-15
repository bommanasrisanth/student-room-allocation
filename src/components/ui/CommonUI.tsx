import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import type { ToastNotice } from '../../types/hostel';

export function StatusBadge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'purple' | 'green' | 'amber' | 'red' | 'slate';
}) {
  const styles: Record<string, string> = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    purple: 'bg-violet-50 text-violet-800 border-violet-200',
    green: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    red: 'bg-rose-50 text-rose-800 border-rose-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border whitespace-nowrap ${styles[tone]}`}
    >
      {label}
    </span>
  );
}

export function getStatusTone(
  status: string
): 'neutral' | 'purple' | 'green' | 'amber' | 'red' | 'slate' {
  switch (status) {
    case 'Active':
    case 'Available':
    case 'Paid':
    case 'Resolved':
    case 'Approved':
    case 'Allocated':
      return 'green';
    case 'Partially Occupied':
    case 'Partially Paid':
    case 'Pending':
    case 'In Progress':
    case 'Submitted':
    case 'Medium':
      return 'amber';
    case 'Full':
    case 'Maintenance':
    case 'Rejected':
    case 'High':
    case 'Inactive':
      return 'red';
    case 'Checked Out':
    case 'Graduated':
    case 'Low':
      return 'slate';
    default:
      return 'purple';
  }
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
      <div className="mx-auto w-11 h-11 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600 max-w-md mx-auto">
        {description}
      </p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
  maxWidth = 'max-w-lg',
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`w-full ${maxWidth} bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden my-auto`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 no-print">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  destructive = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} title={title} onClose={onCancel} maxWidth="max-w-md">
      <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
            destructive
              ? 'bg-rose-600 hover:bg-rose-700'
              : 'bg-violet-800 hover:bg-violet-900'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastNotice[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0 no-print"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const colors =
          toast.kind === 'error'
            ? 'bg-white border-rose-200 text-rose-900'
            : toast.kind === 'info'
            ? 'bg-white border-violet-200 text-slate-900'
            : 'bg-white border-emerald-200 text-slate-900';

        const icon =
          toast.kind === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : toast.kind === 'info' ? (
            <Info className="w-4 h-4 text-violet-700 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          );

        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-3.5 rounded-xl border shadow-md ${colors}`}
          >
            <div className="mt-0.5">{icon}</div>
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="text-slate-400 hover:text-slate-700 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
