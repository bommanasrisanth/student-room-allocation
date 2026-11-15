import React from 'react';
import {
  ArrowRight,
  BedDouble,
  ClipboardList,
  Home,
  IndianRupee,
  MessageSquareWarning,
  Plus,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  buildRecentActivities,
  computeDashboardMetrics,
  formatDate,
  formatINR,
} from '../../services/domainLogic';
import type { HostelDatabase } from '../../types/hostel';
import type { AdminTab } from '../LayoutShell';
import { PageHeader, StatusBadge, getStatusTone } from '../ui/CommonUI';

interface AdminDashboardProps {
  db: HostelDatabase;
  onNavigate: (tab: AdminTab) => void;
}

export function AdminDashboard({ db, onNavigate }: AdminDashboardProps) {
  const metrics = computeDashboardMetrics(db);
  const recentApplications = [...db.applications]
    .sort((a, b) => b.applicationDate.localeCompare(a.applicationDate))
    .slice(0, 5);
  const recentActivities = buildRecentActivities(db).slice(0, 6);

  const statCards = [
    { label: 'Total Students', value: metrics.totalStudents.toString() },
    { label: 'Total Rooms', value: metrics.totalRooms.toString() },
    { label: 'Total Bed Capacity', value: metrics.totalBedCapacity.toString() },
    { label: 'Occupied Beds', value: metrics.occupiedBeds.toString() },
    { label: 'Available Beds', value: metrics.availableBeds.toString() },
    { label: 'Pending Applications', value: metrics.pendingApplications.toString() },
    { label: 'Outstanding Fees', value: formatINR(metrics.outstandingFees) },
    { label: 'Open Complaints', value: metrics.openComplaints.toString() },
  ];

  return (
    <div>
      <PageHeader
        title="Administrator Overview"
        subtitle={`Live occupancy, room applications, fee balances, and maintenance overview for ${db.settings.hostelName}.`}
        action={
          <button
            type="button"
            onClick={() => onNavigate('allocations')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-800 hover:bg-violet-900 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Home className="w-4 h-4" />
            Allocate Room
          </button>
        }
      />

      {/* 8 Live KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-slate-200 rounded-xl p-4"
          >
            <p className="text-xs font-medium text-slate-500">{stat.label}</p>
            <p className="mt-1.5 text-2xl font-semibold text-slate-900 tabular-nums">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Quick Actions
            </h2>
            <p className="text-xs text-slate-500">
              Common administrative workflows
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('students')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-violet-50 hover:text-violet-900 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Manage Students
            </button>
            <button
              type="button"
              onClick={() => onNavigate('rooms')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-violet-50 hover:text-violet-900 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <BedDouble className="w-3.5 h-3.5" />
              Manage Rooms
            </button>
            <button
              type="button"
              onClick={() => onNavigate('applications')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-violet-50 hover:text-violet-900 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Review Applications
            </button>
            <button
              type="button"
              onClick={() => onNavigate('fees')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-violet-50 hover:text-violet-900 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <IndianRupee className="w-3.5 h-3.5" />
              Record Fee Payment
            </button>
            <button
              type="button"
              onClick={() => onNavigate('complaints')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-violet-50 hover:text-violet-900 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <MessageSquareWarning className="w-3.5 h-3.5" />
              View Complaints
            </button>
          </div>
        </div>
      </div>

      {/* Occupancy Chart + Block Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Hostel Occupancy Overview
              </h2>
              <p className="text-xs text-slate-500">
                Occupied vs. available beds across hostel blocks ({metrics.occupancyRate}% overall occupancy)
              </p>
            </div>
            <span className="text-xs font-medium text-violet-800 tabular-nums">
              {metrics.occupiedBeds} of {metrics.totalBedCapacity} beds filled
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.blockBreakdown}
                margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="block"
                  tick={{ fill: '#475569', fontSize: 12 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#475569', fontSize: 12 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey="occupiedBeds"
                  name="Occupied Beds"
                  fill="#5b21b6"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="availableBeds"
                  name="Available Beds"
                  fill="#cbd5e1"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Room Availability Summary */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">
              Room Availability Summary
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('rooms')}
              className="text-xs font-medium text-violet-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              All rooms
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {metrics.blockBreakdown.map((block) => {
              const pct =
                block.totalBeds > 0
                  ? Math.round((block.occupiedBeds / block.totalBeds) * 100)
                  : 0;
              return (
                <div key={block.block} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-900">
                      {block.block}
                    </span>
                    <span className="text-xs text-slate-600 tabular-nums">
                      {block.availableBeds} available · {block.roomsCount} rooms
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-700 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500 tabular-nums">
                    <span>{block.occupiedBeds} occupied</span>
                    <span>{pct}% filled</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Applications & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Recent Applications
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('applications')}
              className="text-xs font-medium text-violet-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              View all
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {recentApplications.length === 0 ? (
            <div className="p-6 text-sm text-slate-500 text-center">
              No room applications submitted yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {recentApplications.map((app) => (
                <div
                  key={app.id}
                  className="px-5 py-3.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {app.studentName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {app.preferredRoomType} · {app.preferredBlock} ·{' '}
                      {formatDate(app.applicationDate)}
                    </p>
                  </div>
                  <StatusBadge
                    label={app.status}
                    tone={getStatusTone(app.status)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Recent Activities
            </h2>
            <span className="text-xs text-slate-500 inline-flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              Latest records
            </span>
          </div>
          {recentActivities.length === 0 ? (
            <div className="p-6 text-sm text-slate-500 text-center">
              No recent hostel activities found.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {recentActivities.map((item) => (
                <div key={item.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">
                      {item.title}
                    </p>
                    <span className="text-xs text-slate-500 tabular-nums shrink-0">
                      {formatDate(item.date)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600">{item.detail}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
