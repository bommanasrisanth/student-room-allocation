import React, { useState } from 'react';
import { RotateCcw, Save } from 'lucide-react';
import type { HostelDatabase, HostelSettings } from '../../types/hostel';
import { ConfirmDialog, PageHeader } from '../ui/CommonUI';

interface AdminSettingsProps {
  db: HostelDatabase;
  onUpdateDb: (next: HostelDatabase) => void;
  onResetDemoData: () => void;
  onNotify: (kind: 'success' | 'error' | 'info', message: string) => void;
}

export function AdminSettings({
  db,
  onUpdateDb,
  onResetDemoData,
  onNotify,
}: AdminSettingsProps) {
  const [form, setForm] = useState<HostelSettings>(db.settings);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.hostelName.trim()) {
      onNotify('error', 'Please enter the hostel name.');
      return;
    }
    if (!form.adminName.trim()) {
      onNotify('error', 'Please enter the administrator name.');
      return;
    }
    if (form.defaultMonthlyFee < 0 || form.securityDeposit < 0) {
      onNotify('error', 'Fee amounts cannot be negative.');
      return;
    }
    if (form.maxStayMonths < 1) {
      onNotify('error', 'Maximum stay duration must be at least 1 month.');
      return;
    }

    onUpdateDb({
      ...db,
      settings: {
        ...form,
        hostelName: form.hostelName.trim(),
        adminName: form.adminName.trim(),
        adminEmail: form.adminEmail.trim(),
        adminPhone: form.adminPhone.trim(),
      },
    });
    onNotify('success', 'Hostel settings saved.');
  };

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Hostel Settings"
        subtitle="Configure core hostel profile, default fee rates, stay policy, and demonstration data."
      />

      <form
        onSubmit={handleSave}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
      >
        <div>
          <h2 className="text-sm font-semibold text-slate-900 mb-3">
            Hostel & Administrator Profile
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label
                htmlFor="set-hostel-name"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Hostel Name
              </label>
              <input
                id="set-hostel-name"
                type="text"
                value={form.hostelName}
                onChange={(e) =>
                  setForm({ ...form, hostelName: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label
                htmlFor="set-admin-name"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Administrator Name
              </label>
              <input
                id="set-admin-name"
                type="text"
                value={form.adminName}
                onChange={(e) =>
                  setForm({ ...form, adminName: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label
                htmlFor="set-admin-email"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Administrator Email
              </label>
              <input
                id="set-admin-email"
                type="email"
                value={form.adminEmail}
                onChange={(e) =>
                  setForm({ ...form, adminEmail: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label
                htmlFor="set-admin-phone"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Administrator Contact
              </label>
              <input
                id="set-admin-phone"
                type="text"
                value={form.adminPhone}
                onChange={(e) =>
                  setForm({ ...form, adminPhone: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">
            Fee & Stay Configuration
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="set-monthly-fee"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Default Monthly Fee (₹)
              </label>
              <input
                id="set-monthly-fee"
                type="number"
                min={0}
                value={form.defaultMonthlyFee}
                onChange={(e) =>
                  setForm({
                    ...form,
                    defaultMonthlyFee: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg tabular-nums"
              />
            </div>

            <div>
              <label
                htmlFor="set-security-deposit"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Security Deposit (₹)
              </label>
              <input
                id="set-security-deposit"
                type="number"
                min={0}
                value={form.securityDeposit}
                onChange={(e) =>
                  setForm({
                    ...form,
                    securityDeposit: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg tabular-nums"
              />
            </div>

            <div>
              <label
                htmlFor="set-max-stay"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Max Stay Duration (Months)
              </label>
              <input
                id="set-max-stay"
                type="number"
                min={1}
                value={form.maxStayMonths}
                onChange={(e) =>
                  setForm({
                    ...form,
                    maxStayMonths: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg tabular-nums"
              />
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-800 hover:bg-violet-900 rounded-lg cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </form>

      {/* Demo Data Reset */}
      <div className="mt-6 bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Reset Demonstration Data
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Restores the default 16 students, 12 hostel rooms, sample applications, fee records, and complaints in browser LocalStorage.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setResetConfirmOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Demo Data
        </button>
      </div>

      <ConfirmDialog
        open={resetConfirmOpen}
        title="Reset Demo Data"
        message="This will clear all custom edits stored in LocalStorage and restore the initial demonstration dataset. Continue?"
        confirmLabel="Reset Data"
        destructive
        onConfirm={() => {
          onResetDemoData();
          setResetConfirmOpen(false);
        }}
        onCancel={() => setResetConfirmOpen(false)}
      />
    </div>
  );
}
