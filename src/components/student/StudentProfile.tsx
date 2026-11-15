import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { formatDate, validateStudentInput } from '../../services/domainLogic';
import type { HostelDatabase, Student } from '../../types/hostel';
import { PageHeader, StatusBadge, getStatusTone } from '../ui/CommonUI';

interface StudentProfileProps {
  db: HostelDatabase;
  student: Student;
  onUpdateDb: (next: HostelDatabase) => void;
  onUpdateDisplayName: (name: string) => void;
  onNotify: (kind: 'success' | 'error' | 'info', message: string) => void;
}

export function StudentProfile({
  db,
  student,
  onUpdateDb,
  onUpdateDisplayName,
  onNotify,
}: StudentProfileProps) {
  const [fullName, setFullName] = useState(student.fullName);
  const [email, setEmail] = useState(student.email);
  const [phone, setPhone] = useState(student.phone);
  const [department, setDepartment] = useState(student.department);
  const [yearOfStudy, setYearOfStudy] = useState(student.yearOfStudy);
  const [error, setError] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const check = validateStudentInput(
      {
        studentId: student.studentId,
        fullName,
        email,
        phone,
        department,
        yearOfStudy,
        joiningDate: student.joiningDate,
        accountStatus: student.accountStatus,
        username: student.username,
      },
      db.students,
      student.id
    );

    if (!check.valid) {
      setError(check.error || 'Please verify your profile details.');
      return;
    }

    const cleanName = fullName.trim();
    const nextStudents = db.students.map((s) =>
      s.id === student.id
        ? {
            ...s,
            fullName: cleanName,
            email: email.trim(),
            phone: phone.trim(),
            department: department.trim(),
            yearOfStudy,
          }
        : s
    );

    onUpdateDb({ ...db, students: nextStudents });
    onUpdateDisplayName(cleanName);
    onNotify('success', 'Your profile has been updated.');
  };

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="My Profile"
        subtitle="Review your student registration details and update permitted contact information."
      />

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200 mb-5">
          <div>
            <p className="text-xs text-slate-500">Student ID</p>
            <p className="font-mono text-base font-semibold text-slate-900">
              {student.studentId}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Joined {formatDate(student.joiningDate)}
            </p>
          </div>
          <StatusBadge
            label={student.accountStatus}
            tone={getStatusTone(student.accountStatus)}
          />
        </div>

        <form onSubmit={handleSave} className="space-y-4" noValidate>
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
              htmlFor="prof-name"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Full Name
            </label>
            <input
              id="prof-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="prof-email"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Email Address
              </label>
              <input
                id="prof-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label
                htmlFor="prof-phone"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Mobile Number
              </label>
              <input
                id="prof-phone"
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
                htmlFor="prof-dept"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Department
              </label>
              <input
                id="prof-dept"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label
                htmlFor="prof-year"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Year of Study
              </label>
              <select
                id="prof-year"
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

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-800 hover:bg-violet-900 rounded-lg cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
