import React, { useMemo } from 'react';
import {
  BedDouble,
  ClipboardList,
  FileText,
  Home,
  MessageSquareWarning,
} from 'lucide-react';
import { formatDate, formatINR } from '../../services/domainLogic';
import type { HostelDatabase, Student } from '../../types/hostel';
import type { StudentTab } from '../LayoutShell';
import { PageHeader, StatusBadge, getStatusTone } from '../ui/CommonUI';

interface StudentDashboardProps {
  db: HostelDatabase;
  student: Student;
  onNavigate: (tab: StudentTab) => void;
}

export function StudentDashboard({
  db,
  student,
  onNavigate,
}: StudentDashboardProps) {
  const myApps = useMemo(
    () =>
      db.applications
        .filter((a) => a.studentRecordId === student.id)
        .sort((a, b) => b.applicationDate.localeCompare(a.applicationDate)),
    [db.applications, student.id]
  );
  const latestApp = myApps[0];

  const activeAllocation = useMemo(
    () =>
      db.allocations.find(
        (a) => a.studentRecordId === student.id && a.status === 'Active'
      ),
    [db.allocations, student.id]
  );

  const myPayments = useMemo(
    () => db.payments.filter((p) => p.studentRecordId === student.id),
    [db.payments, student.id]
  );
  const outstandingFee = myPayments.reduce(
    (sum, p) => sum + Math.max(0, p.outstandingAmount),
    0
  );

  const myComplaints = useMemo(
    () =>
      db.complaints
        .filter((c) => c.studentRecordId === student.id)
        .sort((a, b) => b.submissionDate.localeCompare(a.submissionDate)),
    [db.complaints, student.id]
  );
  const openComplaintsCount = myComplaints.filter(
    (c) => c.status !== 'Resolved'
  ).length;

  const notifications = useMemo(() => {
    const list: Array<{ id: string; title: string; detail: string; date: string }> =
      [];

    if (latestApp) {
      list.push({
        id: `notif-app-${latestApp.id}`,
        title: `Application ${latestApp.status}`,
        detail:
          latestApp.adminRemarks ||
          `Request ${latestApp.applicationId} for ${latestApp.preferredBlock} (${latestApp.preferredRoomType}) is ${latestApp.status.toLowerCase()}.`,
        date: latestApp.applicationDate,
      });
    }

    if (activeAllocation) {
      list.push({
        id: `notif-alloc-${activeAllocation.id}`,
        title: `Room ${activeAllocation.roomNumber} Assigned`,
        detail: `${activeAllocation.block}, ${activeAllocation.floor} · Check-in from ${formatDate(activeAllocation.checkInDate)}`,
        date: activeAllocation.checkInDate,
      });
    }

    if (outstandingFee > 0) {
      list.push({
        id: 'notif-fee',
        title: 'Pending Fee Balance',
        detail: `You have an outstanding balance of ${formatINR(outstandingFee)}. Please contact the hostel office for payment confirmation.`,
        date: myPayments.find((p) => p.outstandingAmount > 0)?.createdDate || '',
      });
    }

    for (const c of myComplaints.slice(0, 2)) {
      list.push({
        id: `notif-cmp-${c.id}`,
        title: `Complaint ${c.complaintId}: ${c.status}`,
        detail:
          c.resolutionNotes ||
          `${c.category} request submitted on ${formatDate(c.submissionDate)}.`,
        date: c.submissionDate,
      });
    }

    return list;
  }, [latestApp, activeAllocation, outstandingFee, myPayments, myComplaints]);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${student.fullName.split(' ')[0]}`}
        subtitle={`${student.studentId} · ${student.department} (${student.yearOfStudy})`}
        action={
          !activeAllocation && (!latestApp || latestApp.status === 'Rejected') ? (
            <button
              type="button"
              onClick={() => onNavigate('apply')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-800 hover:bg-violet-900 rounded-lg cursor-pointer whitespace-nowrap"
            >
              <FileText className="w-4 h-4" />
              Apply for Hostel Room
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('availability')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer whitespace-nowrap"
            >
              <BedDouble className="w-4 h-4" />
              View Available Rooms
            </button>
          )
        }
      />

      {/* Key Student Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">
            Application Status
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-lg font-semibold text-slate-900">
              {latestApp ? latestApp.status : 'Not Applied'}
            </span>
            {latestApp && (
              <StatusBadge
                label={latestApp.status}
                tone={getStatusTone(latestApp.status)}
              />
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">
            Room Allocation
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-lg font-semibold text-slate-900">
              {activeAllocation
                ? `Room ${activeAllocation.roomNumber}`
                : 'Not Assigned'}
            </span>
            <StatusBadge
              label={activeAllocation ? 'Allocated' : 'Unassigned'}
              tone={activeAllocation ? 'green' : 'neutral'}
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Outstanding Fees</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
            {formatINR(outstandingFee)}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">
            Maintenance Complaints
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
            {openComplaintsCount} open
            <span className="text-xs font-normal text-slate-500 ml-1.5">
              ({myComplaints.length} total)
            </span>
          </p>
        </div>
      </div>

      {/* Room Details + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">
              Allocated Room Details
            </h2>
            <button
              type="button"
              onClick={() => onNavigate(activeAllocation ? 'my-room' : 'apply')}
              className="text-xs font-medium text-violet-800 hover:underline cursor-pointer"
            >
              {activeAllocation ? 'View room details' : 'Apply now'}
            </button>
          </div>

          {activeAllocation ? (
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-violet-50 border border-violet-200">
                <p className="text-lg font-semibold text-slate-900">
                  Room {activeAllocation.roomNumber} · {activeAllocation.block}
                </p>
                <p className="text-sm text-slate-700 mt-0.5">
                  {activeAllocation.floor} · {activeAllocation.roomType} Room
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm pt-1">
                <div>
                  <dt className="text-xs text-slate-500">Check-in Date</dt>
                  <dd className="font-medium text-slate-900">
                    {formatDate(activeAllocation.checkInDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Monthly Fee</dt>
                  <dd className="font-medium text-slate-900 tabular-nums">
                    {formatINR(activeAllocation.monthlyFee)}
                  </dd>
                </div>
              </dl>
            </div>
          ) : (
            <div className="py-6 text-center">
              <div className="mx-auto w-10 h-10 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center mb-2.5">
                <Home className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-slate-900">
                No room has been assigned yet
              </p>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                {latestApp
                  ? `Your application (${latestApp.applicationId}) is currently ${latestApp.status}.`
                  : 'Submit a hostel room application using the button above to request accommodation.'}
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('availability')}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Browse Available Rooms
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">
              Recent Notifications
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('complaints')}
              className="text-xs font-medium text-violet-800 hover:underline cursor-pointer"
            >
              My complaints
            </button>
          </div>

          {notifications.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              No recent notifications.
            </p>
          ) : (
            <div className="divide-y divide-slate-200">
              {notifications.map((n) => (
                <div key={n.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">
                      {n.title}
                    </p>
                    {n.date && (
                      <span className="text-xs text-slate-500 tabular-nums shrink-0">
                        {formatDate(n.date)}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600">{n.detail}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigate('my-application')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Track Application
            </button>
            <button
              type="button"
              onClick={() => onNavigate('complaints')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
            >
              <MessageSquareWarning className="w-3.5 h-3.5" />
              Report Issue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
