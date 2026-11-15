import React, { useState } from 'react';
import { CheckCircle2, FileText } from 'lucide-react';
import {
  hasActiveOrApprovedApplication,
  todayISO,
} from '../../services/domainLogic';
import type {
  HostelDatabase,
  RoomApplication,
  RoomType,
  Student,
} from '../../types/hostel';
import type { StudentTab } from '../LayoutShell';
import { PageHeader } from '../ui/CommonUI';

interface StudentApplicationFormProps {
  db: HostelDatabase;
  student: Student;
  onUpdateDb: (next: HostelDatabase) => void;
  onNotify: (kind: 'success' | 'error' | 'info', message: string) => void;
  onNavigate: (tab: StudentTab) => void;
}

export function StudentApplicationForm({
  db,
  student,
  onUpdateDb,
  onNotify,
  onNavigate,
}: StudentApplicationFormProps) {
  const alreadyActive = hasActiveOrApprovedApplication(
    student.id,
    db.applications,
    db.allocations
  );

  const [fullName, setFullName] = useState(student.fullName);
  const [email, setEmail] = useState(student.email);
  const [phone, setPhone] = useState(student.phone);
  const [department, setDepartment] = useState(student.department);
  const [yearOfStudy, setYearOfStudy] = useState(student.yearOfStudy);
  const [preferredBlock, setPreferredBlock] = useState('Block A');
  const [preferredRoomType, setPreferredRoomType] = useState<RoomType>('Double');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (alreadyActive) {
      setError(
        'You already have an active room allocation or an open application in review.'
      );
      return;
    }

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!department.trim()) {
      setError('Please enter your department.');
      return;
    }

    const nextNum = db.applications.length + 1;
    const newApp: RoomApplication = {
      id: `app-${Date.now()}`,
      applicationId: `APP-2026-${String(nextNum).padStart(3, '0')}`,
      studentRecordId: student.id,
      studentId: student.studentId,
      studentName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      department: department.trim(),
      yearOfStudy,
      applicationDate: todayISO(),
      preferredRoomType,
      preferredBlock,
      remarks: remarks.trim(),
      adminRemarks: '',
      status: 'Pending',
    };

    onUpdateDb({
      ...db,
      applications: [newApp, ...db.applications],
    });
    onNotify(
      'success',
      `Hostel application ${newApp.applicationId} submitted with Pending status.`
    );
    onNavigate('my-application');
  };

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Hostel Room Application"
        subtitle="Submit your accommodation preferences for administrator review and bed allocation."
      />

      {alreadyActive ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-violet-800 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Active Request or Room Found
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                You already have an active room allocation or a pending/approved
                application under review. Duplicate active applications are not
                permitted.
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => onNavigate('my-application')}
                  className="px-4 py-2 text-sm font-medium text-white bg-violet-800 hover:bg-violet-900 rounded-lg cursor-pointer"
                >
                  View My Application
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('my-room')}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  View My Room
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          noValidate
        >
          {error && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800"
            >
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="apply-stu-id"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Student ID
              </label>
              <input
                id="apply-stu-id"
                type="text"
                value={student.studentId}
                disabled
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 text-slate-600 rounded-lg font-mono"
              />
            </div>
            <div>
              <label
                htmlFor="apply-name"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Full Name
              </label>
              <input
                id="apply-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="apply-email"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Email Address
              </label>
              <input
                id="apply-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label
                htmlFor="apply-phone"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Phone Number
              </label>
              <input
                id="apply-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="apply-dept"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Department
              </label>
              <input
                id="apply-dept"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label
                htmlFor="apply-year"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Year of Study
              </label>
              <select
                id="apply-year"
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
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
                htmlFor="apply-block"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Preferred Block
              </label>
              <select
                id="apply-block"
                value={preferredBlock}
                onChange={(e) => setPreferredBlock(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              >
                <option value="Block A">Block A</option>
                <option value="Block B">Block B</option>
                <option value="Block C">Block C</option>
                <option value="Block D">Block D</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="apply-room-type"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Preferred Room Type
              </label>
              <select
                id="apply-room-type"
                value={preferredRoomType}
                onChange={(e) =>
                  setPreferredRoomType(e.target.value as RoomType)
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              >
                <option value="Single">Single</option>
                <option value="Double">Double</option>
                <option value="Triple">Triple</option>
                <option value="Shared">Shared</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="apply-remarks"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Additional Remarks (Optional)
            </label>
            <textarea
              id="apply-remarks"
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Share any floor preferences, medical needs, or arrival notes..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-violet-800 hover:bg-violet-900 rounded-lg cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Submit Application
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
