import React, { useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import {
  canDeleteStudent,
  formatDate,
  todayISO,
  validateStudentInput,
} from '../../services/domainLogic';
import type {
  AccountStatus,
  HostelDatabase,
  Student,
} from '../../types/hostel';
import {
  ConfirmDialog,
  EmptyState,
  Modal,
  PageHeader,
  StatusBadge,
  getStatusTone,
} from '../ui/CommonUI';

interface StudentManagementProps {
  db: HostelDatabase;
  onUpdateDb: (next: HostelDatabase) => void;
  onNotify: (kind: 'success' | 'error' | 'info', message: string) => void;
}

const EMPTY_FORM: Omit<Student, 'id'> = {
  studentId: '',
  fullName: '',
  email: '',
  phone: '',
  department: 'Computer Science',
  yearOfStudy: '1st Year',
  joiningDate: todayISO(),
  accountStatus: 'Active',
};

const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Electronics & Comm.',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Data Science',
  'Architecture',
  'Biotechnology',
];

export function StudentManagement({
  db,
  onUpdateDb,
  onNotify,
}: StudentManagementProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [deptFilter, setDeptFilter] = useState<string>('All');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formState, setFormState] = useState<Omit<Student, 'id'>>(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  const allocationByStudent = useMemo(() => {
    const map = new Map<string, string>();
    for (const alloc of db.allocations) {
      if (alloc.status === 'Active') {
        map.set(alloc.studentRecordId, `${alloc.roomNumber} (${alloc.block})`);
      }
    }
    return map;
  }, [db.allocations]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return db.students.filter((s) => {
      const matchesSearch =
        !q ||
        s.studentId.toLowerCase().includes(q) ||
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.includes(q);
      const matchesStatus =
        statusFilter === 'All' || s.accountStatus === statusFilter;
      const matchesDept =
        deptFilter === 'All' || s.department === deptFilter;
      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [db.students, search, statusFilter, deptFilter]);

  const openAddModal = () => {
    setEditingStudent(null);
    setFormState({
      ...EMPTY_FORM,
      joiningDate: todayISO(),
      studentId: `STU-2026-${String(db.students.length + 1).padStart(3, '0')}`,
    });
    setFormError('');
    setFormModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormState({
      studentId: student.studentId,
      fullName: student.fullName,
      email: student.email,
      phone: student.phone,
      department: student.department,
      yearOfStudy: student.yearOfStudy,
      joiningDate: student.joiningDate,
      accountStatus: student.accountStatus,
      username: student.username,
    });
    setFormError('');
    setFormModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateStudentInput(
      formState,
      db.students,
      editingStudent?.id
    );
    if (!check.valid) {
      setFormError(check.error || 'Please check the student details.');
      return;
    }

    if (editingStudent) {
      const nextStudents = db.students.map((s) =>
        s.id === editingStudent.id
          ? {
              ...s,
              ...formState,
              studentId: formState.studentId.trim(),
              fullName: formState.fullName.trim(),
              email: formState.email.trim(),
              phone: formState.phone.trim(),
            }
          : s
      );
      onUpdateDb({ ...db, students: nextStudents });
      onNotify('success', `Updated student record for ${formState.fullName.trim()}.`);
    } else {
      const newStudent: Student = {
        id: `stu-${Date.now()}`,
        ...formState,
        studentId: formState.studentId.trim(),
        fullName: formState.fullName.trim(),
        email: formState.email.trim(),
        phone: formState.phone.trim(),
      };
      onUpdateDb({ ...db, students: [newStudent, ...db.students] });
      onNotify('success', `Student ${newStudent.fullName} added successfully.`);
    }

    setFormModalOpen(false);
  };

  const requestDelete = (student: Student) => {
    const check = canDeleteStudent(student.id, db.allocations, db.payments);
    if (!check.valid) {
      onNotify('error', check.error || 'Cannot delete student.');
      return;
    }
    setDeleteTarget(student);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const nextStudents = db.students.filter((s) => s.id !== deleteTarget.id);
    onUpdateDb({ ...db, students: nextStudents });
    onNotify('success', `Student ${deleteTarget.fullName} removed.`);
    setDeleteTarget(null);
  };

  const viewedAllocation = viewStudent
    ? db.allocations.find(
        (a) => a.studentRecordId === viewStudent.id && a.status === 'Active'
      )
    : undefined;

  return (
    <div>
      <PageHeader
        title="Student Management"
        subtitle="Manage student directory records, department enrollment, and accommodation status."
        action={
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-800 hover:bg-violet-900 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        }
      />

      {/* Search & Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            aria-label="Search students"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student ID, name, email, or phone..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-700/20 focus:border-violet-700"
          />
        </div>
        <select
          aria-label="Filter by account status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-700/20 focus:border-violet-700"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Graduated">Graduated</option>
        </select>
        <select
          aria-label="Filter by department"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-700/20 focus:border-violet-700"
        >
          <option value="All">All Departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {filteredStudents.length === 0 ? (
        <EmptyState
          icon={<Users className="w-5 h-5" />}
          title="No matching students"
          description="Try clearing your search filters or register a new student."
          action={
            <button
              type="button"
              onClick={openAddModal}
              className="px-4 py-2 text-sm font-medium text-white bg-violet-800 hover:bg-violet-900 rounded-lg"
            >
              Add Student
            </button>
          }
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Department & Year</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Room</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredStudents.map((student) => {
                  const roomLabel = allocationByStudent.get(student.id);
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                        {student.studentId}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900">
                          {student.fullName}
                        </p>
                        <p className="text-xs text-slate-500">{student.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-slate-800">{student.department}</p>
                        <p className="text-xs text-slate-500">
                          {student.yearOfStudy}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-slate-700 tabular-nums whitespace-nowrap">
                        {student.phone}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {roomLabel ? (
                          <span className="text-xs font-medium text-violet-900 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-md">
                            {roomLabel}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">
                            Not allocated
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge
                          label={student.accountStatus}
                          tone={getStatusTone(student.accountStatus)}
                        />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setViewStudent(student)}
                            aria-label={`View ${student.fullName}`}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(student)}
                            aria-label={`Edit ${student.fullName}`}
                            className="p-1.5 text-slate-500 hover:text-violet-800 hover:bg-violet-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDelete(student)}
                            aria-label={`Delete ${student.fullName}`}
                            className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Student Modal */}
      <Modal
        open={formModalOpen}
        title={editingStudent ? 'Edit Student' : 'Add New Student'}
        onClose={() => setFormModalOpen(false)}
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
                htmlFor="stu-id"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Student ID
              </label>
              <input
                id="stu-id"
                type="text"
                value={formState.studentId}
                onChange={(e) =>
                  setFormState({ ...formState, studentId: e.target.value })
                }
                placeholder="e.g. STU-2026-017"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-700/20 focus:border-violet-700"
              />
            </div>

            <div>
              <label
                htmlFor="stu-name"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Full Name
              </label>
              <input
                id="stu-name"
                type="text"
                value={formState.fullName}
                onChange={(e) =>
                  setFormState({ ...formState, fullName: e.target.value })
                }
                placeholder="Student full name"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-700/20 focus:border-violet-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="stu-email"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Email Address
              </label>
              <input
                id="stu-email"
                type="email"
                value={formState.email}
                onChange={(e) =>
                  setFormState({ ...formState, email: e.target.value })
                }
                placeholder="name@vidyavihar.edu.in"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-700/20 focus:border-violet-700"
              />
            </div>

            <div>
              <label
                htmlFor="stu-phone"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Mobile Number
              </label>
              <input
                id="stu-phone"
                type="tel"
                value={formState.phone}
                onChange={(e) =>
                  setFormState({ ...formState, phone: e.target.value })
                }
                placeholder="10-digit mobile number"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-700/20 focus:border-violet-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="stu-dept"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Department
              </label>
              <select
                id="stu-dept"
                value={formState.department}
                onChange={(e) =>
                  setFormState({ ...formState, department: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-700/20 focus:border-violet-700"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="stu-year"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Year of Study
              </label>
              <select
                id="stu-year"
                value={formState.yearOfStudy}
                onChange={(e) =>
                  setFormState({ ...formState, yearOfStudy: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-700/20 focus:border-violet-700"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Postgraduate">Postgraduate</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="stu-joining"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Joining Date
              </label>
              <input
                id="stu-joining"
                type="date"
                value={formState.joiningDate}
                onChange={(e) =>
                  setFormState({ ...formState, joiningDate: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-700/20 focus:border-violet-700"
              />
            </div>

            <div>
              <label
                htmlFor="stu-status"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Account Status
              </label>
              <select
                id="stu-status"
                value={formState.accountStatus}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    accountStatus: e.target.value as AccountStatus,
                  })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-700/20 focus:border-violet-700"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Graduated">Graduated</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setFormModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-violet-800 hover:bg-violet-900 rounded-lg"
            >
              {editingStudent ? 'Save Changes' : 'Register Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Student Details Modal */}
      <Modal
        open={Boolean(viewStudent)}
        title="Student Accommodation Details"
        onClose={() => setViewStudent(null)}
      >
        {viewStudent && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {viewStudent.fullName}
                </h3>
                <p className="text-xs font-mono text-slate-500 mt-0.5">
                  {viewStudent.studentId}
                </p>
              </div>
              <StatusBadge
                label={viewStudent.accountStatus}
                tone={getStatusTone(viewStudent.accountStatus)}
              />
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Email</dt>
                <dd className="text-slate-900 break-all">{viewStudent.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Phone</dt>
                <dd className="text-slate-900 tabular-nums">
                  {viewStudent.phone}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Department</dt>
                <dd className="text-slate-900">{viewStudent.department}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Year of Study</dt>
                <dd className="text-slate-900">{viewStudent.yearOfStudy}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Joining Date</dt>
                <dd className="text-slate-900">
                  {formatDate(viewStudent.joiningDate)}
                </dd>
              </div>
            </dl>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <h4 className="text-xs font-semibold text-slate-700 mb-2">
                Current Room Allocation
              </h4>
              {viewedAllocation ? (
                <div className="text-sm text-slate-800 space-y-1">
                  <p className="font-medium">
                    Room {viewedAllocation.roomNumber} · {viewedAllocation.block} (
                    {viewedAllocation.floor})
                  </p>
                  <p className="text-xs text-slate-600">
                    Type: {viewedAllocation.roomType} · Check-in:{' '}
                    {formatDate(viewedAllocation.checkInDate)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No active room allocation assigned.
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Student"
        message={
          deleteTarget
            ? `Are you sure you want to remove ${deleteTarget.fullName} (${deleteTarget.studentId}) from the student directory?`
            : ''
        }
        confirmLabel="Delete Student"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
