import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  CheckCircle2,
  Home,
  LogOut as CheckoutIcon,
  UserCheck,
} from 'lucide-react';
import {
  allocateRoomToStudent,
  calculateExpectedCheckout,
  changeStudentRoom,
  checkoutStudent,
  formatDate,
  formatINR,
  recommendRoomsForApplication,
  todayISO,
} from '../../services/domainLogic';
import type { Allocation, HostelDatabase } from '../../types/hostel';
import {
  EmptyState,
  Modal,
  PageHeader,
  StatusBadge,
  getStatusTone,
} from '../ui/CommonUI';

interface RoomAllocationProps {
  db: HostelDatabase;
  preselectedApplicationId?: string | null;
  onClearPreselection: () => void;
  onUpdateDb: (next: HostelDatabase) => void;
  onNotify: (kind: 'success' | 'error' | 'info', message: string) => void;
}

export function RoomAllocation({
  db,
  preselectedApplicationId,
  onClearPreselection,
  onUpdateDb,
  onNotify,
}: RoomAllocationProps) {
  const [viewMode, setViewMode] = useState<'allocate' | 'active' | 'history'>(
    'allocate'
  );

  const approvedApplications = useMemo(
    () => db.applications.filter((a) => a.status === 'Approved'),
    [db.applications]
  );

  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [checkInDate, setCheckInDate] = useState(todayISO());
  const [expectedCheckoutDate, setExpectedCheckoutDate] = useState(
    calculateExpectedCheckout(todayISO(), db.settings.maxStayMonths)
  );

  // Room Change modal
  const [roomChangeTarget, setRoomChangeTarget] = useState<Allocation | null>(
    null
  );
  const [newRoomId, setNewRoomId] = useState<string>('');

  // Checkout modal
  const [checkoutTarget, setCheckoutTarget] = useState<Allocation | null>(null);
  const [actualCheckoutDate, setActualCheckoutDate] = useState(todayISO());

  useEffect(() => {
    if (preselectedApplicationId) {
      setSelectedAppId(preselectedApplicationId);
      setViewMode('allocate');
      onClearPreselection();
    }
  }, [preselectedApplicationId, onClearPreselection]);

  useEffect(() => {
    if (!selectedAppId && approvedApplications.length > 0) {
      setSelectedAppId(approvedApplications[0].id);
    }
  }, [approvedApplications, selectedAppId]);

  const selectedApplication = useMemo(
    () => approvedApplications.find((a) => a.id === selectedAppId) || null,
    [approvedApplications, selectedAppId]
  );

  const selectedStudent = useMemo(
    () =>
      selectedApplication
        ? db.students.find((s) => s.id === selectedApplication.studentRecordId) ||
          null
        : null,
    [db.students, selectedApplication]
  );

  const recommendations = useMemo(() => {
    if (!selectedApplication) return [];
    return recommendRoomsForApplication(selectedApplication, db.rooms);
  }, [selectedApplication, db.rooms]);

  useEffect(() => {
    if (recommendations.length > 0) {
      setSelectedRoomId(recommendations[0].room.id);
    } else {
      setSelectedRoomId('');
    }
  }, [selectedAppId, recommendations]);

  const activeAllocations = useMemo(
    () => db.allocations.filter((a) => a.status === 'Active'),
    [db.allocations]
  );

  const historyAllocations = useMemo(
    () => db.allocations.filter((a) => a.status === 'Checked Out'),
    [db.allocations]
  );

  const handleConfirmAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplication) {
      onNotify('error', 'Please select an approved application first.');
      return;
    }
    if (!selectedRoomId) {
      onNotify('error', 'Please select an available room.');
      return;
    }

    const result = allocateRoomToStudent(db, {
      studentRecordId: selectedApplication.studentRecordId,
      roomId: selectedRoomId,
      applicationId: selectedApplication.id,
      checkInDate,
      expectedCheckoutDate,
    });

    if (!result.ok || !result.data) {
      onNotify('error', result.message);
      return;
    }

    onUpdateDb(result.data);
    onNotify('success', result.message);
    setSelectedAppId('');
    setSelectedRoomId('');
  };

  const toggleCheckIn = (alloc: Allocation) => {
    const nextAllocations = db.allocations.map((a) =>
      a.id === alloc.id
        ? { ...a, checkedInConfirmed: !a.checkedInConfirmed }
        : a
    );
    onUpdateDb({ ...db, allocations: nextAllocations });
    onNotify(
      'success',
      !alloc.checkedInConfirmed
        ? `${alloc.studentName} marked as checked in to Room ${alloc.roomNumber}.`
        : `Check-in confirmation updated for ${alloc.studentName}.`
    );
  };

  const openRoomChangeModal = (alloc: Allocation) => {
    setRoomChangeTarget(alloc);
    const availableOthers = db.rooms.filter(
      (r) =>
        r.id !== alloc.roomId &&
        r.status !== 'Maintenance' &&
        r.availableBeds > 0
    );
    setNewRoomId(availableOthers[0]?.id || '');
  };

  const handleConfirmRoomChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomChangeTarget) return;
    const res = changeStudentRoom(db, roomChangeTarget.id, newRoomId);
    if (!res.ok || !res.data) {
      onNotify('error', res.message);
      return;
    }
    onUpdateDb(res.data);
    onNotify('success', res.message);
    setRoomChangeTarget(null);
  };

  const openCheckoutModal = (alloc: Allocation) => {
    setCheckoutTarget(alloc);
    setActualCheckoutDate(todayISO());
  };

  const handleConfirmCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutTarget) return;
    const res = checkoutStudent(db, checkoutTarget.id, actualCheckoutDate);
    if (!res.ok || !res.data) {
      onNotify('error', res.message);
      return;
    }
    onUpdateDb(res.data);
    onNotify('success', res.message);
    setCheckoutTarget(null);
  };

  const availableDestinationRooms = roomChangeTarget
    ? db.rooms.filter(
        (r) =>
          r.id !== roomChangeTarget.roomId &&
          r.status !== 'Maintenance' &&
          r.availableBeds > 0
      )
    : [];

  return (
    <div>
      <PageHeader
        title="Room Allocation & Check-In"
        subtitle="Assign beds to approved applications, manage active check-ins, execute room transfers, and process student checkouts."
      />

      {/* Section Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg w-fit mb-6">
        <button
          type="button"
          onClick={() => setViewMode('allocate')}
          className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
            viewMode === 'allocate'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Allocate Approved ({approvedApplications.length})
        </button>
        <button
          type="button"
          onClick={() => setViewMode('active')}
          className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
            viewMode === 'active'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Active Allocations ({activeAllocations.length})
        </button>
        <button
          type="button"
          onClick={() => setViewMode('history')}
          className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
            viewMode === 'history'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Allocation History ({historyAllocations.length})
        </button>
      </div>

      {/* Allocate Approved Application */}
      {viewMode === 'allocate' && (
        <>
          {approvedApplications.length === 0 ? (
            <EmptyState
              icon={<Home className="w-5 h-5" />}
              title="No approved applications waiting for allocation"
              description="Approve a pending student application in Application Management first, then return here to assign a bed."
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Step 1: Select Approved Application */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-slate-900 mb-3">
                  1. Approved Applications
                </h2>
                <div className="space-y-2.5">
                  {approvedApplications.map((app) => {
                    const isSelected = selectedAppId === app.id;
                    return (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => setSelectedAppId(app.id)}
                        className={`w-full text-left p-3.5 rounded-lg border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-violet-50 border-violet-300'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-900">
                            {app.studentName}
                          </span>
                          <span className="text-xs font-mono text-slate-500">
                            {app.applicationId}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600">
                          {app.preferredBlock} · {app.preferredRoomType}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {selectedStudent && selectedApplication && (
                  <div className="mt-5 pt-4 border-t border-slate-200 space-y-2 text-xs">
                    <p className="font-semibold text-slate-800">
                      Applicant Details
                    </p>
                    <p className="text-slate-600">
                      ID: <span className="font-mono">{selectedStudent.studentId}</span>
                    </p>
                    <p className="text-slate-600">
                      Program: {selectedStudent.department} ({selectedStudent.yearOfStudy})
                    </p>
                    <p className="text-slate-600">
                      Preferred: {selectedApplication.preferredBlock} ·{' '}
                      {selectedApplication.preferredRoomType}
                    </p>
                    {selectedApplication.remarks && (
                      <p className="text-slate-600">
                        Remarks: “{selectedApplication.remarks}”
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2 & 3: Recommended Rooms & Confirm */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      2. Select Capacity-Checked Room
                    </h2>
                    <p className="text-xs text-slate-500">
                      Rooms in the student’s preferred block are listed first. Full and maintenance rooms are excluded.
                    </p>
                  </div>
                </div>

                {recommendations.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
                    No rooms currently have available beds. Add a room or check out an outgoing student first.
                  </div>
                ) : (
                  <form onSubmit={handleConfirmAllocation} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {recommendations.map(({ room, matchTier }) => {
                        const chosen = selectedRoomId === room.id;
                        return (
                          <label
                            key={room.id}
                            className={`flex flex-col justify-between p-3.5 rounded-lg border cursor-pointer transition-colors ${
                              chosen
                                ? 'bg-violet-50 border-violet-400'
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="selected-room"
                                  value={room.id}
                                  checked={chosen}
                                  onChange={() => setSelectedRoomId(room.id)}
                                  className="text-violet-800 focus:ring-violet-700"
                                />
                                <span className="font-mono font-semibold text-sm text-slate-900">
                                  Room {room.roomNumber}
                                </span>
                              </div>
                              <StatusBadge
                                label={matchTier}
                                tone={
                                  matchTier === 'Exact Match'
                                    ? 'green'
                                    : matchTier === 'Preferred Block'
                                    ? 'purple'
                                    : 'neutral'
                                }
                              />
                            </div>
                            <div className="mt-2 pl-6 text-xs text-slate-600 space-y-1">
                              <p>
                                {room.block} · {room.floor} · {room.roomType}
                              </p>
                              <p className="tabular-nums font-medium text-slate-800">
                                {room.availableBeds} of {room.totalCapacity} beds available ·{' '}
                                {formatINR(room.monthlyFee)}/mo
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                      <div>
                        <label
                          htmlFor="alloc-checkin"
                          className="block text-xs font-medium text-slate-700 mb-1"
                        >
                          Check-in Date
                        </label>
                        <input
                          id="alloc-checkin"
                          type="date"
                          value={checkInDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCheckInDate(val);
                            setExpectedCheckoutDate(
                              calculateExpectedCheckout(
                                val,
                                db.settings.maxStayMonths
                              )
                            );
                          }}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="alloc-checkout"
                          className="block text-xs font-medium text-slate-700 mb-1"
                        >
                          Expected Checkout Date
                        </label>
                        <input
                          id="alloc-checkout"
                          type="date"
                          value={expectedCheckoutDate}
                          onChange={(e) => setExpectedCheckoutDate(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-violet-800 hover:bg-violet-900 rounded-lg transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Confirm Room Allocation
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Active Allocations */}
      {viewMode === 'active' && (
        <>
          {activeAllocations.length === 0 ? (
            <EmptyState
              icon={<Home className="w-5 h-5" />}
              title="No active allocations"
              description="Allocated students will appear here with check-in, room transfer, and checkout actions."
            />
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-4">Allocation ID</th>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Assigned Room</th>
                      <th className="py-3 px-4">Check-in</th>
                      <th className="py-3 px-4">Arrival Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {activeAllocations.map((alloc) => (
                      <tr key={alloc.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono text-xs text-slate-700">
                          {alloc.allocationId}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-900">
                            {alloc.studentName}
                          </p>
                          <p className="text-xs font-mono text-slate-500">
                            {alloc.studentId}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-900">
                            Room {alloc.roomNumber}
                          </p>
                          <p className="text-xs text-slate-500">
                            {alloc.block} · {alloc.roomType}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-slate-700 tabular-nums whitespace-nowrap">
                          {formatDate(alloc.checkInDate)}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge
                            label={
                              alloc.checkedInConfirmed
                                ? 'Checked In'
                                : 'Pending Arrival'
                            }
                            tone={alloc.checkedInConfirmed ? 'green' : 'amber'}
                          />
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => toggleCheckIn(alloc)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              {alloc.checkedInConfirmed ? 'Checked In' : 'Check In'}
                            </button>
                            <button
                              type="button"
                              onClick={() => openRoomChangeModal(alloc)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-violet-800 bg-violet-50 border border-violet-200 hover:bg-violet-100 rounded-lg cursor-pointer"
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                              Change Room
                            </button>
                            <button
                              type="button"
                              onClick={() => openCheckoutModal(alloc)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg cursor-pointer"
                            >
                              <CheckoutIcon className="w-3.5 h-3.5" />
                              Checkout
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Allocation History */}
      {viewMode === 'history' && (
        <>
          {historyAllocations.length === 0 ? (
            <EmptyState
              icon={<Home className="w-5 h-5" />}
              title="No past allocations yet"
              description="Checked-out residency records are preserved here for audit and reporting."
            />
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-4">Allocation ID</th>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Room</th>
                      <th className="py-3 px-4">Check-in Date</th>
                      <th className="py-3 px-4">Actual Checkout</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {historyAllocations.map((alloc) => (
                      <tr key={alloc.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono text-xs text-slate-700">
                          {alloc.allocationId}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-900">
                            {alloc.studentName}
                          </p>
                          <p className="text-xs font-mono text-slate-500">
                            {alloc.studentId}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          Room {alloc.roomNumber} · {alloc.block}
                        </td>
                        <td className="py-3 px-4 tabular-nums text-slate-700">
                          {formatDate(alloc.checkInDate)}
                        </td>
                        <td className="py-3 px-4 tabular-nums text-slate-700">
                          {formatDate(alloc.actualCheckoutDate)}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge
                            label={alloc.status}
                            tone={getStatusTone(alloc.status)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Room Change Modal */}
      <Modal
        open={Boolean(roomChangeTarget)}
        title="Change Student Room"
        onClose={() => setRoomChangeTarget(null)}
      >
        {roomChangeTarget && (
          <form onSubmit={handleConfirmRoomChange} className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm">
              <p className="font-medium text-slate-900">
                {roomChangeTarget.studentName} ({roomChangeTarget.studentId})
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                Current Room: {roomChangeTarget.roomNumber} ({roomChangeTarget.block})
              </p>
            </div>

            {availableDestinationRooms.length === 0 ? (
              <p className="text-sm text-rose-700">
                No other rooms have available beds for a transfer right now.
              </p>
            ) : (
              <div>
                <label
                  htmlFor="change-room-select"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Select Destination Room
                </label>
                <select
                  id="change-room-select"
                  value={newRoomId}
                  onChange={(e) => setNewRoomId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                >
                  {availableDestinationRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.roomNumber} — {r.block} ({r.roomType},{' '}
                      {r.availableBeds} bed(s) free, {formatINR(r.monthlyFee)}/mo)
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-slate-500">
                  The previous bed will be released and the new bed reserved in one step.
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRoomChangeTarget(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={availableDestinationRooms.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-violet-800 hover:bg-violet-900 rounded-lg disabled:opacity-50"
              >
                Confirm Transfer
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Checkout Modal */}
      <Modal
        open={Boolean(checkoutTarget)}
        title="Confirm Student Checkout"
        onClose={() => setCheckoutTarget(null)}
        maxWidth="max-w-md"
      >
        {checkoutTarget && (
          <form onSubmit={handleConfirmCheckout} className="space-y-4">
            <p className="text-sm text-slate-600">
              Checking out{' '}
              <span className="font-semibold text-slate-900">
                {checkoutTarget.studentName}
              </span>{' '}
              from Room{' '}
              <span className="font-mono font-semibold text-slate-900">
                {checkoutTarget.roomNumber}
              </span>{' '}
              will free 1 bed and archive this allocation into history.
            </p>
            <div>
              <label
                htmlFor="actual-checkout-date"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Actual Checkout Date
              </label>
              <input
                id="actual-checkout-date"
                type="date"
                value={actualCheckoutDate}
                onChange={(e) => setActualCheckoutDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCheckoutTarget(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                Complete Checkout
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
