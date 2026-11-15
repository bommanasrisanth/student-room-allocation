import React, { useMemo, useState } from 'react';
import { MessageSquareWarning, Send } from 'lucide-react';
import { formatDate, todayISO } from '../../services/domainLogic';
import type {
  Complaint,
  ComplaintCategory,
  ComplaintPriority,
  HostelDatabase,
  Student,
} from '../../types/hostel';
import {
  EmptyState,
  PageHeader,
  StatusBadge,
  getStatusTone,
} from '../ui/CommonUI';

interface StudentComplaintsProps {
  db: HostelDatabase;
  student: Student;
  onUpdateDb: (next: HostelDatabase) => void;
  onNotify: (kind: 'success' | 'error' | 'info', message: string) => void;
}

const CATEGORIES: ComplaintCategory[] = [
  'Electrical',
  'Plumbing',
  'Cleaning',
  'Furniture',
  'Internet',
  'Other',
];

export function StudentComplaints({
  db,
  student,
  onUpdateDb,
  onNotify,
}: StudentComplaintsProps) {
  const activeAllocation = db.allocations.find(
    (a) => a.studentRecordId === student.id && a.status === 'Active'
  );

  const [category, setCategory] = useState<ComplaintCategory>('Electrical');
  const [priority, setPriority] = useState<ComplaintPriority>('Medium');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const myComplaints = useMemo(
    () =>
      db.complaints
        .filter((c) => c.studentRecordId === student.id)
        .sort((a, b) => b.submissionDate.localeCompare(a.submissionDate)),
    [db.complaints, student.id]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!description.trim() || description.trim().length < 8) {
      setError('Please describe the maintenance issue (at least 8 characters).');
      return;
    }

    const nextNum = db.complaints.length + 1;
    const newComplaint: Complaint = {
      id: `cmp-${Date.now()}`,
      complaintId: `CMP-2026-${String(nextNum).padStart(2, '0')}`,
      studentRecordId: student.id,
      studentId: student.studentId,
      studentName: student.fullName,
      roomNumber: activeAllocation ? activeAllocation.roomNumber : 'General',
      category,
      description: description.trim(),
      priority,
      submissionDate: todayISO(),
      status: 'Submitted',
    };

    onUpdateDb({
      ...db,
      complaints: [newComplaint, ...db.complaints],
    });
    setDescription('');
    onNotify(
      'success',
      `Complaint ${newComplaint.complaintId} submitted to maintenance.`
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-2">
        <PageHeader
          title="My Complaints"
          subtitle="Report maintenance issues and track resolution status."
        />
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
          noValidate
        >
          <h2 className="text-sm font-semibold text-slate-900">
            Submit New Complaint
          </h2>

          {error && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800"
            >
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="stu-cmp-room"
              className="block text-xs font-medium text-slate-600 mb-1"
            >
              Room / Location
            </label>
            <input
              id="stu-cmp-room"
              type="text"
              value={
                activeAllocation
                  ? `Room ${activeAllocation.roomNumber} (${activeAllocation.block})`
                  : 'General Hostel Area'
              }
              disabled
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 text-slate-600 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="stu-cmp-category"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Category
              </label>
              <select
                id="stu-cmp-category"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as ComplaintCategory)
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="stu-cmp-priority"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Priority
              </label>
              <select
                id="stu-cmp-priority"
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as ComplaintPriority)
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="stu-cmp-desc"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Issue Description
            </label>
            <textarea
              id="stu-cmp-desc"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue clearly so maintenance staff can assist quickly..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-violet-800 hover:bg-violet-900 rounded-lg cursor-pointer"
          >
            <Send className="w-4 h-4" />
            Submit Complaint
          </button>
        </form>
      </div>

      <div className="lg:col-span-3 lg:pt-16">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Your Complaint History ({myComplaints.length})
          </h2>
        </div>

        {myComplaints.length === 0 ? (
          <EmptyState
            icon={<MessageSquareWarning className="w-5 h-5" />}
            title="No complaints submitted"
            description="Any maintenance requests you submit will be tracked here."
          />
        ) : (
          <div className="space-y-3">
            {myComplaints.map((c) => (
              <div
                key={c.id}
                className="bg-white border border-slate-200 rounded-xl p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-800">
                      {c.complaintId}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs font-medium text-slate-700">
                      {c.category}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500">
                      {formatDate(c.submissionDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge
                      label={c.priority}
                      tone={getStatusTone(c.priority)}
                    />
                    <StatusBadge
                      label={c.status}
                      tone={getStatusTone(c.status)}
                    />
                  </div>
                </div>
                <p className="mt-2.5 text-sm text-slate-800">{c.description}</p>
                {c.resolutionNotes && (
                  <p className="mt-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    Maintenance note: {c.resolutionNotes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
