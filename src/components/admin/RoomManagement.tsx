import React, { useMemo, useState } from 'react';
import { BedDouble, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import {
  canDeleteRoom,
  computeRoomStatus,
  formatINR,
  normalizeRoom,
  validateRoomInput,
} from '../../services/domainLogic';
import type {
  HostelDatabase,
  Room,
  RoomStatus,
  RoomType,
} from '../../types/hostel';
import {
  ConfirmDialog,
  EmptyState,
  Modal,
  PageHeader,
  StatusBadge,
  getStatusTone,
} from '../ui/CommonUI';

interface RoomManagementProps {
  db: HostelDatabase;
  onUpdateDb: (next: HostelDatabase) => void;
  onNotify: (kind: 'success' | 'error' | 'info', message: string) => void;
}

const ROOM_TYPES: RoomType[] = ['Single', 'Double', 'Triple', 'Shared'];
const BLOCKS = ['Block A', 'Block B', 'Block C', 'Block D'];
const FLOORS = ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor'];

export function RoomManagement({
  db,
  onUpdateDb,
  onNotify,
}: RoomManagementProps) {
  const [search, setSearch] = useState('');
  const [blockFilter, setBlockFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomNumber, setRoomNumber] = useState('');
  const [block, setBlock] = useState('Block A');
  const [floor, setFloor] = useState('1st Floor');
  const [roomType, setRoomType] = useState<RoomType>('Double');
  const [totalCapacity, setTotalCapacity] = useState(2);
  const [occupiedBeds, setOccupiedBeds] = useState(0);
  const [monthlyFee, setMonthlyFee] = useState(db.settings.defaultMonthlyFee);
  const [facilitiesText, setFacilitiesText] = useState('Wi-Fi, Study Desk, Wardrobe');
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [formError, setFormError] = useState('');

  const [viewRoom, setViewRoom] = useState<Room | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);

  const filteredRooms = useMemo(() => {
    const q = search.trim().toLowerCase();
    return db.rooms.filter((r) => {
      const matchesSearch =
        !q ||
        r.roomNumber.toLowerCase().includes(q) ||
        r.block.toLowerCase().includes(q) ||
        r.facilities.some((f) => f.toLowerCase().includes(q));
      const matchesBlock = blockFilter === 'All' || r.block === blockFilter;
      const matchesType = typeFilter === 'All' || r.roomType === typeFilter;
      const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
      return matchesSearch && matchesBlock && matchesType && matchesStatus;
    });
  }, [db.rooms, search, blockFilter, typeFilter, statusFilter]);

  const openAddModal = () => {
    setEditingRoom(null);
    setRoomNumber('');
    setBlock('Block A');
    setFloor('1st Floor');
    setRoomType('Double');
    setTotalCapacity(2);
    setOccupiedBeds(0);
    setMonthlyFee(db.settings.defaultMonthlyFee);
    setFacilitiesText('Wi-Fi, Study Desk, Wardrobe');
    setIsMaintenance(false);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setRoomNumber(room.roomNumber);
    setBlock(room.block);
    setFloor(room.floor);
    setRoomType(room.roomType);
    setTotalCapacity(room.totalCapacity);
    setOccupiedBeds(room.occupiedBeds);
    setMonthlyFee(room.monthlyFee);
    setFacilitiesText(room.facilities.join(', '));
    setIsMaintenance(room.status === 'Maintenance');
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const targetStatus: RoomStatus = isMaintenance
      ? 'Maintenance'
      : computeRoomStatus(totalCapacity, occupiedBeds);

    const check = validateRoomInput(
      {
        roomNumber,
        block,
        floor,
        totalCapacity: Number(totalCapacity),
        occupiedBeds: Number(occupiedBeds),
        monthlyFee: Number(monthlyFee),
        status: targetStatus,
      },
      db.rooms,
      editingRoom?.id
    );

    if (!check.valid) {
      setFormError(check.error || 'Please verify the room details.');
      return;
    }

    const facilities = facilitiesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingRoom) {
      const activeOccupants = db.allocations.filter(
        (a) => a.roomId === editingRoom.id && a.status === 'Active'
      ).length;

      if (Number(totalCapacity) < activeOccupants) {
        setFormError(
          `Room capacity cannot be reduced below currently occupied beds (${activeOccupants}).`
        );
        return;
      }

      const updated = normalizeRoom(
        {
          ...editingRoom,
          roomNumber: roomNumber.trim(),
          block,
          floor,
          roomType,
          totalCapacity: Number(totalCapacity),
          occupiedBeds: activeOccupants,
          monthlyFee: Number(monthlyFee),
          facilities,
          status: targetStatus,
        },
        !isMaintenance
      );

      const nextRooms = db.rooms.map((r) =>
        r.id === editingRoom.id ? updated : r
      );
      onUpdateDb({ ...db, rooms: nextRooms });
      onNotify('success', `Room ${updated.roomNumber} updated.`);
    } else {
      const created = normalizeRoom({
        id: `room-${Date.now()}`,
        roomNumber: roomNumber.trim(),
        block,
        floor,
        roomType,
        totalCapacity: Number(totalCapacity),
        occupiedBeds: 0,
        availableBeds: Number(totalCapacity),
        monthlyFee: Number(monthlyFee),
        facilities,
        status: isMaintenance ? 'Maintenance' : 'Available',
      });
      onUpdateDb({ ...db, rooms: [created, ...db.rooms] });
      onNotify('success', `Room ${created.roomNumber} added successfully.`);
    }

    setModalOpen(false);
  };

  const requestDelete = (room: Room) => {
    const check = canDeleteRoom(room.id, db.allocations);
    if (!check.valid) {
      onNotify('error', check.error || 'Room cannot be deleted.');
      return;
    }
    setDeleteTarget(room);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const nextRooms = db.rooms.filter((r) => r.id !== deleteTarget.id);
    onUpdateDb({ ...db, rooms: nextRooms });
    onNotify('success', `Room ${deleteTarget.roomNumber} deleted.`);
    setDeleteTarget(null);
  };

  const roomOccupants = viewRoom
    ? db.allocations.filter(
        (a) => a.roomId === viewRoom.id && a.status === 'Active'
      )
    : [];

  return (
    <div>
      <PageHeader
        title="Room Management"
        subtitle="Configure hostel rooms, bed capacities, monthly fees, and maintenance availability."
        action={
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-800 hover:bg-violet-900 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Room
          </button>
        }
      />

      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            aria-label="Search rooms"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search room number or facility..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-700/20 focus:border-violet-700"
          />
        </div>
        <select
          aria-label="Filter by block"
          value={blockFilter}
          onChange={(e) => setBlockFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
        >
          <option value="All">All Blocks</option>
          {BLOCKS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by room type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
        >
          <option value="All">All Room Types</option>
          {ROOM_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by room status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
        >
          <option value="All">All Statuses</option>
          <option value="Available">Available</option>
          <option value="Partially Occupied">Partially Occupied</option>
          <option value="Full">Full</option>
          <option value="Maintenance">Maintenance</option>
        </select>
      </div>

      {filteredRooms.length === 0 ? (
        <EmptyState
          icon={<BedDouble className="w-5 h-5" />}
          title="No rooms match your filters"
          description="Adjust your search filters or add a new hostel room."
          action={
            <button
              type="button"
              onClick={openAddModal}
              className="px-4 py-2 text-sm font-medium text-white bg-violet-800 hover:bg-violet-900 rounded-lg"
            >
              Add Room
            </button>
          }
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Room</th>
                  <th className="py-3 px-4">Block & Floor</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Beds (Occ / Cap)</th>
                  <th className="py-3 px-4">Available</th>
                  <th className="py-3 px-4">Monthly Fee</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredRooms.map((room) => (
                  <tr key={room.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      {room.roomNumber}
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-slate-900">{room.block}</p>
                      <p className="text-xs text-slate-500">{room.floor}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{room.roomType}</td>
                    <td className="py-3 px-4 tabular-nums text-slate-700">
                      {room.occupiedBeds} / {room.totalCapacity}
                    </td>
                    <td className="py-3 px-4 tabular-nums font-medium text-slate-900">
                      {room.status === 'Maintenance' ? 0 : room.availableBeds}
                    </td>
                    <td className="py-3 px-4 tabular-nums text-slate-900">
                      {formatINR(room.monthlyFee)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge
                        label={room.status}
                        tone={getStatusTone(room.status)}
                      />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setViewRoom(room)}
                          aria-label={`View room ${room.roomNumber}`}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(room)}
                          aria-label={`Edit room ${room.roomNumber}`}
                          className="p-1.5 text-slate-500 hover:text-violet-800 hover:bg-violet-50 rounded-lg cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => requestDelete(room)}
                          aria-label={`Delete room ${room.roomNumber}`}
                          className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Add/Edit Room Modal */}
      <Modal
        open={modalOpen}
        title={editingRoom ? `Edit Room ${editingRoom.roomNumber}` : 'Add Hostel Room'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSave} className="space-y-4" noValidate>
          {formError && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800"
            >
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="room-number"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Room Number
              </label>
              <input
                id="room-number"
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="e.g. A-204"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label
                htmlFor="room-block"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Block
              </label>
              <select
                id="room-block"
                value={block}
                onChange={(e) => setBlock(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              >
                {BLOCKS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="room-floor"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Floor
              </label>
              <select
                id="room-floor"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              >
                {FLOORS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="room-type"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Room Type
              </label>
              <select
                id="room-type"
                value={roomType}
                onChange={(e) => {
                  const nextType = e.target.value as RoomType;
                  setRoomType(nextType);
                  if (!editingRoom) {
                    const suggestedCap =
                      nextType === 'Single'
                        ? 1
                        : nextType === 'Double'
                        ? 2
                        : nextType === 'Triple'
                        ? 3
                        : 4;
                    setTotalCapacity(suggestedCap);
                  }
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              >
                {ROOM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="room-capacity"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Total Capacity
              </label>
              <input
                id="room-capacity"
                type="number"
                min={1}
                value={totalCapacity}
                onChange={(e) => setTotalCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg tabular-nums"
              />
            </div>

            <div>
              <label
                htmlFor="room-occupied"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Occupied Beds
              </label>
              <input
                id="room-occupied"
                type="number"
                value={occupiedBeds}
                disabled
                className="w-full px-3 py-2 text-sm border border-slate-200 bg-slate-50 text-slate-500 rounded-lg tabular-nums"
              />
            </div>

            <div>
              <label
                htmlFor="room-fee"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Monthly Fee (₹)
              </label>
              <input
                id="room-fee"
                type="number"
                min={0}
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg tabular-nums"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="room-facilities"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Facilities (comma-separated)
            </label>
            <input
              id="room-facilities"
              type="text"
              value={facilitiesText}
              onChange={(e) => setFacilitiesText(e.target.value)}
              placeholder="Wi-Fi, Study Desk, Attached Bath"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isMaintenance}
              onChange={(e) => setIsMaintenance(e.target.checked)}
              className="rounded border-slate-300 text-violet-800 focus:ring-violet-700"
            />
            <span>Mark room under maintenance (blocks new allocations)</span>
          </label>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-violet-800 hover:bg-violet-900 rounded-lg"
            >
              {editingRoom ? 'Save Changes' : 'Create Room'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Room Details Modal */}
      <Modal
        open={Boolean(viewRoom)}
        title={viewRoom ? `Room ${viewRoom.roomNumber} Details` : 'Room Details'}
        onClose={() => setViewRoom(null)}
      >
        {viewRoom && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <p className="text-base font-semibold text-slate-900">
                  {viewRoom.block} · {viewRoom.floor}
                </p>
                <p className="text-sm text-slate-600">
                  {viewRoom.roomType} Room · {formatINR(viewRoom.monthlyFee)}/month
                </p>
              </div>
              <StatusBadge
                label={viewRoom.status}
                tone={getStatusTone(viewRoom.status)}
              />
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500">Capacity</p>
                <p className="text-lg font-semibold text-slate-900 tabular-nums">
                  {viewRoom.totalCapacity}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500">Occupied</p>
                <p className="text-lg font-semibold text-slate-900 tabular-nums">
                  {viewRoom.occupiedBeds}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500">Available</p>
                <p className="text-lg font-semibold text-slate-900 tabular-nums">
                  {viewRoom.availableBeds}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-700 mb-1.5">
                Facilities
              </h4>
              <p className="text-sm text-slate-600">
                {viewRoom.facilities.length > 0
                  ? viewRoom.facilities.join(' · ')
                  : 'Standard furnishings'}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-700 mb-2">
                Current Occupants ({roomOccupants.length})
              </h4>
              {roomOccupants.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No students currently assigned to this room.
                </p>
              ) : (
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                  {roomOccupants.map((occ) => (
                    <div
                      key={occ.id}
                      className="px-3 py-2.5 flex items-center justify-between text-sm"
                    >
                      <span className="font-medium text-slate-900">
                        {occ.studentName}
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        {occ.studentId}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Room"
        message={
          deleteTarget
            ? `Are you sure you want to delete Room ${deleteTarget.roomNumber} (${deleteTarget.block})?`
            : ''
        }
        confirmLabel="Delete Room"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
