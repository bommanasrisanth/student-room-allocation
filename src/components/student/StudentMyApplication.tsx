import React from 'react';
import { ClipboardList, FileText } from 'lucide-react';
import { formatDate } from '../../services/domainLogic';
import type { HostelDatabase, Student } from '../../types/hostel';
import type { StudentTab } from '../LayoutShell';
import { EmptyState, PageHeader, StatusBadge, getStatusTone } from '../ui/CommonUI';

interface StudentMyApplicationProps {
  db: HostelDatabase;
  student: Student;
  onNavigate: (tab: StudentTab) => void;
}

export function StudentMyApplication({
  db,
  student,
  onNavigate,
}: StudentMyApplicationProps) {
  const myApplications = db.applications
    .filter((a) => a.studentRecordId === student.id)
    .sort((a, b) => b.applicationDate.localeCompare(a.applicationDate));

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="My Application"
        subtitle="Track the status of your hostel room accommodation requests and administrator remarks."
      />

      {myApplications.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="w-5 h-5" />}
          title="No applications submitted yet"
          description="Submit a hostel application to request a room assignment for the current semester."
          action={
            <button
              type="button"
              onClick={() => onNavigate('apply')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-800 hover:bg-violet-900 rounded-lg cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Apply for Hostel Room
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {myApplications.map((app) => (
            <div
              key={app.id}
              className="bg-white border border-slate-200 rounded-xl p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <p className="font-mono text-sm font-semibold text-slate-900">
                    {app.applicationId}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Submitted on {formatDate(app.applicationDate)}
                  </p>
                </div>
                <StatusBadge
                  label={app.status}
                  tone={getStatusTone(app.status)}
                />
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Preferred Block</dt>
                  <dd className="font-medium text-slate-900">
                    {app.preferredBlock}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">
                    Preferred Room Type
                  </dt>
                  <dd className="font-medium text-slate-900">
                    {app.preferredRoomType}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Department</dt>
                  <dd className="text-slate-800">
                    {app.department} ({app.yearOfStudy})
                  </dd>
                </div>
              </dl>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs font-semibold text-slate-700 mb-1">
                  Administrator Remarks
                </p>
                <p className="text-sm text-slate-700">
                  {app.adminRemarks ||
                    'Your application is queued for review by the hostel administrator.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
