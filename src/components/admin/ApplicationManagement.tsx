import React, { useMemo, useState } from 'react';
import { Check, ClipboardList, Eye, Home, X } from 'lucide-react';
import { formatDate } from '../../services/domainLogic';
import type { HostelDatabase, RoomApplication } from '../../types/hostel';
import type { AdminTab } from '../LayoutShell';
import {
  EmptyState,
  Modal,
  PageHeader,
  StatusBadge,
  getStatusTone,
} from '../ui/CommonUI';

interface ApplicationManagementProps {
  db: HostelDatabase;
  onUpdateDb: (next: HostelDatabase) => void;
  onNotify: (kind: 'success' | 'error' | 'info', message: string) => void;
  onNavigateToAllocation: (applicationId: string) => void;
  onNavigateTab: (tab: AdminTab) => void;
}

export function ApplicationManagement({
  db,
  onUpdateDb,
  onNotify,
  onNavigateToAllocation,
}: ApplicationManagementProps) {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedApp, setSelectedApp] = useState<RoomApplication | null>(null);
  const [remarksInput, setRemarksInput] = useState('');

  const filteredApps = useMemo(() => {
    return [...db.applications]
      .filter((a) => statusFilter === 'All' || a.status === statusFilter)
      .sort((a, b) => b.applicationDate.localeCompare(a.applicationDate));
  }, [db.applications, statusFilter]);

  const openReviewModal = (app: RoomApplication) => {
    setSelectedApp(app);
    setRemarksInput(app.adminRemarks || '');
  };

  const handleDecision = (decision: 'Approved' | 'Rejected') => {
    if (!selectedApp) return;

    if (decision === 'Rejected' && !remarksInput.trim()) {
      onNotify(
        'error',
        'Please add a brief remark explaining why the application was rejected.'
      );
      return;
    }

    const nextApps = db.applications.map((a) =>
      a.id === selectedApp.id
        ? {
            ...a,
            status: decision,
            adminRemarks: remarksInput.trim(),
          }
        : a
    );

    onUpdateDb({ ...db, applications: nextApps });
    onNotify(
      'success',
      decision === 'Approved'
        ? `Application ${selectedApp.applicationId} approved. Proceed to Room Allocation to assign a bed.`
        : `Application ${selectedApp.applicationId} rejected.`
    );
    setSelectedApp(null);
  };

  return (
    <div>
      <PageHeader
        title="Application Management"
        subtitle="Review student room requests. Approving an application marks it ready for capacity-checked Room Allocation."
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg w-fit mb-5">
        {['All', 'Pending', 'Approved', 'Allocated', 'Rejected'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatusFilter(tab)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              statusFilter === tab
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {filteredApps.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="w-5 h-5" />}
          title="No applications in this status"
          description="Student room accommodation requests will appear here once submitted."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Application ID</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Applied Date</th>
                  <th className="py-3 px-4">Preferences</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                      {app.applicationId}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-900">
                        {app.studentName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {app.studentId} · {app.department}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-slate-700 tabular-nums whitespace-nowrap">
                      {formatDate(app.applicationDate)}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {app.preferredRoomType} · {app.preferredBlock}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge
                        label={app.status}
                        tone={getStatusTone(app.status)}
                      />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openReviewModal(app)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {app.status === 'Pending' ? 'Review' : 'View'}
                        </button>
                        {app.status === 'Approved' && (
                          <button
                            type="button"
                            onClick={() => onNavigateToAllocation(app.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-violet-800 hover:bg-violet-900 rounded-lg cursor-pointer"
                          >
                            <Home className="w-3.5 h-3.5" />
                            Allocate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review / View Application Modal */}
      <Modal
        open={Boolean(selectedApp)}
        title={
          selectedApp
            ? `Application ${selectedApp.applicationId}`
            : 'Application Details'
        }
        onClose={() => setSelectedApp(null)}
      >
        {selectedApp && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {selectedApp.studentName}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedApp.studentId} · {selectedApp.department} (
                  {selectedApp.yearOfStudy})
                </p>
              </div>
              <StatusBadge
                label={selectedApp.status}
                tone={getStatusTone(selectedApp.status)}
              />
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Preferred Block</dt>
                <dd className="font-medium text-slate-900">
                  {selectedApp.preferredBlock}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Preferred Room Type</dt>
                <dd className="font-medium text-slate-900">
                  {selectedApp.preferredRoomType}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Email</dt>
                <dd className="text-slate-800 break-all">{selectedApp.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Phone</dt>
                <dd className="text-slate-800 tabular-nums">
                  {selectedApp.phone}
                </dd>
              </div>
            </dl>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs font-medium text-slate-600 mb-1">
                Student Remarks
              </p>
              <p className="text-sm text-slate-800">
                {selectedApp.remarks || 'No additional remarks provided.'}
              </p>
            </div>

            <div>
              <label
                htmlFor="app-admin-remarks"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Administrator Remarks
              </label>
              <textarea
                id="app-admin-remarks"
                rows={3}
                value={remarksInput}
                onChange={(e) => setRemarksInput(e.target.value)}
                disabled={selectedApp.status === 'Allocated'}
                placeholder="Enter verification notes or decision reason..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-700/20 focus:border-violet-700 disabled:bg-slate-50"
              />
            </div>

            {selectedApp.status === 'Pending' && (
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => handleDecision('Rejected')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision('Approved')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-violet-800 hover:bg-violet-900 rounded-lg cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Approve Application
                </button>
              </div>
            )}

            {selectedApp.status === 'Approved' && (
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleDecision('Rejected')}
                  className="text-xs font-medium text-rose-700 hover:underline cursor-pointer"
                >
                  Revoke & Reject
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = selectedApp.id;
                    setSelectedApp(null);
                    onNavigateToAllocation(id);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-violet-800 hover:bg-violet-900 rounded-lg cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  Proceed to Room Allocation
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
