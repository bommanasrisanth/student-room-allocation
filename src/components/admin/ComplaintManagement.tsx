import React, { useMemo, useState } from 'react';
import { MessageSquareWarning } from 'lucide-react';
import { formatDate } from '../../services/domainLogic';
import type {
  Complaint,
  ComplaintStatus,
  HostelDatabase,
} from '../../types/hostel';
import {
  EmptyState,
  Modal,
  PageHeader,
  StatusBadge,
  getStatusTone,
} from '../ui/CommonUI';

interface ComplaintManagementProps {
  db: HostelDatabase;
  onUpdateDb: (next: HostelDatabase) => void;
  onNotify: (kind: 'success' | 'error' | 'info', message: string) => void;
}

export function ComplaintManagement({
  db,
  onUpdateDb,
  onNotify,
}: ComplaintManagementProps) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  const [selected, setSelected] = useState<Complaint | null>(null);
  const [nextStatus, setNextStatus] = useState<ComplaintStatus>('In Progress');
  const [notes, setNotes] = useState('');

  const filtered = useMemo(() => {
    return [...db.complaints]
      .filter((c) => {
        const sMatch = statusFilter === 'All' || c.status === statusFilter;
        const pMatch =
          priorityFilter === 'All' || c.priority === priorityFilter;
        return sMatch && pMatch;
      })
      .sort((a, b) => b.submissionDate.localeCompare(a.submissionDate));
  }, [db.complaints, statusFilter, priorityFilter]);

  const openManageModal = (complaint: Complaint) => {
    setSelected(complaint);
    setNextStatus(complaint.status);
    setNotes(complaint.resolutionNotes || '');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    const nextComplaints = db.complaints.map((c) =>
      c.id === selected.id
        ? {
            ...c,
            status: nextStatus,
            resolutionNotes: notes.trim(),
          }
        : c
    );

    onUpdateDb({ ...db, complaints: nextComplaints });
    onNotify(
      'success',
      `Complaint ${selected.complaintId} updated to ${nextStatus}.`
    );
    setSelected(null);
  };

  return (
    <div>
      <PageHeader
        title="Complaint Management"
        subtitle="Track student maintenance requests, assign work statuses, and record resolution notes."
      />

      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 flex flex-wrap gap-3">
        <select
          aria-label="Filter complaints by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
        >
          <option value="All">All Statuses</option>
          <option value="Submitted">Submitted</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>

        <select
          aria-label="Filter complaints by priority"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
        >
          <option value="All">All Priorities</option>
          <option value="High">High Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="Low">Low Priority</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<MessageSquareWarning className="w-5 h-5" />}
          title="No complaints match these filters"
          description="Student maintenance complaints will appear here once submitted."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Complaint ID</th>
                  <th className="py-3 px-4">Student & Room</th>
                  <th className="py-3 px-4">Category & Issue</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                      {c.complaintId}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-900">
                        {c.studentName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {c.studentId} · Room {c.roomNumber}
                      </p>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-medium text-slate-900">{c.category}</p>
                      <p className="text-xs text-slate-600 truncate">
                        {c.description}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge
                        label={c.priority}
                        tone={getStatusTone(c.priority)}
                      />
                    </td>
                    <td className="py-3 px-4 tabular-nums text-slate-700 whitespace-nowrap">
                      {formatDate(c.submissionDate)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge
                        label={c.status}
                        tone={getStatusTone(c.status)}
                      />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openManageModal(c)}
                        className="px-3 py-1.5 text-xs font-medium text-violet-800 bg-violet-50 border border-violet-200 hover:bg-violet-100 rounded-lg cursor-pointer"
                      >
                        Update Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={Boolean(selected)}
        title={
          selected
            ? `Update Complaint ${selected.complaintId}`
            : 'Update Complaint'
        }
        onClose={() => setSelected(null)}
      >
        {selected && (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-sm space-y-1">
              <p className="font-semibold text-slate-900">
                {selected.category} — Room {selected.roomNumber}
              </p>
              <p className="text-xs text-slate-500">
                Reported by {selected.studentName} ({selected.studentId}) on{' '}
                {formatDate(selected.submissionDate)}
              </p>
              <p className="text-sm text-slate-700 pt-1">
                {selected.description}
              </p>
            </div>

            <div>
              <label
                htmlFor="complaint-status"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Status
              </label>
              <select
                id="complaint-status"
                value={nextStatus}
                onChange={(e) =>
                  setNextStatus(e.target.value as ComplaintStatus)
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              >
                <option value="Submitted">Submitted</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="complaint-notes"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Resolution / Maintenance Notes
              </label>
              <textarea
                id="complaint-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe technician assignment or resolution summary..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-violet-800 hover:bg-violet-900 rounded-lg"
              >
                Save Update
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
