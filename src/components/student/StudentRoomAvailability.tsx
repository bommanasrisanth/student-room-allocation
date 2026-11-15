import React, { useMemo, useState } from 'react';
import { BedDouble } from 'lucide-react';
import { formatINR } from '../../services/domainLogic';
import type { HostelDatabase } from '../../types/hostel';
import { EmptyState, PageHeader, StatusBadge, getStatusTone } from '../ui/CommonUI';

interface StudentRoomAvailabilityProps {
  db: HostelDatabase;
}

export function StudentRoomAvailability({ db }: StudentRoomAvailabilityProps) {
  const [blockFilter, setBlockFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [onlyAvailable, setOnlyAvailable] = useState(true);

  const blocks = useMemo(
    () => Array.from(new Set(db.rooms.map((r) => r.block))).sort(),
    [db.rooms]
  );

  const filteredRooms = useMemo(() => {
    return db.rooms.filter((r) => {
      const bMatch = blockFilter === 'All' || r.block === blockFilter;
      const tMatch = typeFilter === 'All' || r.roomType === typeFilter;
      const aMatch =
        !onlyAvailable || (r.availableBeds > 0 && r.status !== 'Maintenance');
      return bMatch && tMatch && aMatch;
    });
  }, [db.rooms, blockFilter, typeFilter, onlyAvailable]);

  return (
    <div>
      <PageHeader
        title="Room Availability"
        subtitle="Browse hostel rooms, monthly rates, bed capacities, and included facilities. Room allocation is handled by the hostel administrator."
      />

      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 flex flex-wrap items-center gap-3">
        <select
          aria-label="Filter rooms by block"
          value={blockFilter}
          onChange={(e) => setBlockFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
        >
          <option value="All">All Blocks</option>
          {blocks.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter rooms by type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
        >
          <option value="All">All Room Types</option>
          <option value="Single">Single</option>
          <option value="Double">Double</option>
          <option value="Triple">Triple</option>
          <option value="Shared">Shared</option>
        </select>

        <label className="flex items-center gap-2 text-sm text-slate-700 ml-auto cursor-pointer">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
            className="rounded border-slate-300 text-violet-800 focus:ring-violet-700"
          />
          <span>Show only rooms with free beds</span>
        </label>
      </div>

      {filteredRooms.length === 0 ? (
        <EmptyState
          icon={<BedDouble className="w-5 h-5" />}
          title="No rooms match your filter"
          description="Try selecting a different block or unchecking the availability filter."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 font-mono">
                      Room {room.roomNumber}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {room.block} · {room.floor} · {room.roomType}
                    </p>
                  </div>
                  <StatusBadge
                    label={room.status}
                    tone={getStatusTone(room.status)}
                  />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                  <div>
                    <p className="text-[11px] text-slate-500">Capacity</p>
                    <p className="text-sm font-semibold text-slate-900 tabular-nums">
                      {room.totalCapacity}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500">Occupied</p>
                    <p className="text-sm font-semibold text-slate-900 tabular-nums">
                      {room.occupiedBeds}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500">Available</p>
                    <p className="text-sm font-semibold text-violet-800 tabular-nums">
                      {room.status === 'Maintenance' ? 0 : room.availableBeds}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-600">
                  Facilities:{' '}
                  {room.facilities.length > 0
                    ? room.facilities.join(' · ')
                    : 'Standard'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500">Monthly Fee</span>
                <span className="text-base font-semibold text-slate-900 tabular-nums">
                  {formatINR(room.monthlyFee)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
