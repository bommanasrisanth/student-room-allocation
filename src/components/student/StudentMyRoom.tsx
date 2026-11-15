import React from 'react';
import { BedDouble, FileText, Home } from 'lucide-react';
import { formatDate, formatINR } from '../../services/domainLogic';
import type { HostelDatabase, Student } from '../../types/hostel';
import type { StudentTab } from '../LayoutShell';
import { EmptyState, PageHeader, StatusBadge } from '../ui/CommonUI';

interface StudentMyRoomProps {
  db: HostelDatabase;
  student: Student;
  onNavigate: (tab: StudentTab) => void;
}

export function StudentMyRoom({ db, student, onNavigate }: StudentMyRoomProps) {
  const activeAllocation = db.allocations.find(
    (a) => a.studentRecordId === student.id && a.status === 'Active'
  );
  const assignedRoom = activeAllocation
    ? db.rooms.find((r) => r.id === activeAllocation.roomId)
    : undefined;

  const pastAllocations = db.allocations.filter(
    (a) => a.studentRecordId === student.id && a.status === 'Checked Out'
  );

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="My Room"
        subtitle="View your active hostel room assignment, check-in dates, and monthly fee details."
      />

      {!activeAllocation ? (
        <EmptyState
          icon={<Home className="w-5 h-5" />}
          title="No room has been assigned yet"
          description="Once your hostel application is approved and a room is allocated by the hostel administrator, your room details will appear here."
          action={
            <div className="flex flex-wrap gap-2.5 justify-center">
              <button
                type="button"
                onClick={() => onNavigate('apply')}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-800 hover:bg-violet-900 rounded-lg cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                Submit Application
              </button>
              <button
                type="button"
                onClick={() => onNavigate('availability')}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                <BedDouble className="w-4 h-4" />
                View Available Rooms
              </button>
            </div>
          }
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-200">
            <div>
              <span className="text-xs font-mono text-slate-500">
                Allocation {activeAllocation.allocationId}
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">
                Room {activeAllocation.roomNumber}
              </h2>
              <p className="text-sm text-slate-600 mt-0.5">
                {activeAllocation.block} · {activeAllocation.floor} ·{' '}
                {activeAllocation.roomType} Occupancy
              </p>
            </div>
            <StatusBadge
              label={
                activeAllocation.checkedInConfirmed
                  ? 'Checked In'
                  : 'Pending Check-In'
              }
              tone={activeAllocation.checkedInConfirmed ? 'green' : 'amber'}
            />
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 py-5">
            <div>
              <dt className="text-xs text-slate-500">Check-in Date</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900 tabular-nums">
                {formatDate(activeAllocation.checkInDate)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Expected Checkout</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900 tabular-nums">
                {formatDate(activeAllocation.expectedCheckoutDate)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Monthly Fee</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900 tabular-nums">
                {formatINR(activeAllocation.monthlyFee)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Room Capacity</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900 tabular-nums">
                {assignedRoom
                  ? `${assignedRoom.occupiedBeds} / ${assignedRoom.totalCapacity} beds occupied`
                  : '—'}
              </dd>
            </div>
          </dl>

          {assignedRoom && assignedRoom.facilities.length > 0 && (
            <div className="pt-4 border-t border-slate-200">
              <p className="text-xs font-semibold text-slate-700 mb-1">
                Included Room Facilities
              </p>
              <p className="text-sm text-slate-600">
                {assignedRoom.facilities.join(' · ')}
              </p>
            </div>
          )}
        </div>
      )}

      {pastAllocations.length > 0 && (
        <div className="mt-6 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">
              Previous Hostel Stays
            </h3>
          </div>
          <div className="divide-y divide-slate-200">
            {pastAllocations.map((past) => (
              <div
                key={past.id}
                className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    Room {past.roomNumber} · {past.block} ({past.roomType})
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDate(past.checkInDate)} to{' '}
                    {formatDate(past.actualCheckoutDate)}
                  </p>
                </div>
                <StatusBadge label="Checked Out" tone="slate" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
