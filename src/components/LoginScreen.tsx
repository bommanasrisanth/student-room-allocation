import React, { useState } from 'react';
import { Building2, Eye, EyeOff, Info, Lock, User } from 'lucide-react';
import type { AuthSession, Student } from '../types/hostel';

interface LoginScreenProps {
  students: Student[];
  hostelName: string;
  onLogin: (session: AuthSession) => void;
}

export function LoginScreen({ students, hostelName, onLogin }: LoginScreenProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanId = identifier.trim().toLowerCase();
    const cleanPwd = password;

    if (!cleanId) {
      setError('Please enter your username or email address.');
      return;
    }
    if (!cleanPwd) {
      setError('Please enter your password.');
      return;
    }

    if (
      (cleanId === 'admin' || cleanId === 'admin@hostelpro.edu.in') &&
      cleanPwd === 'admin123'
    ) {
      onLogin({
        role: 'admin',
        username: 'admin',
        displayName: 'Dr. Meera Iyer (Administrator)',
      });
      return;
    }

    if (
      (cleanId === 'student' ||
        cleanId === 'rohan.kulkarni@vidyavihar.edu.in') &&
      cleanPwd === 'student123'
    ) {
      const demoStudent =
        students.find((s) => s.username === 'student') ??
        students.find((s) => s.studentId === 'STU-2026-016') ??
        students[0];

      if (!demoStudent) {
        setError('Demo student record is missing. Please reset demo data.');
        return;
      }

      onLogin({
        role: 'student',
        username: 'student',
        displayName: demoStudent.fullName,
        studentRecordId: demoStudent.id,
      });
      return;
    }

    setError(
      'Invalid username or password. Please check your credentials and try again.'
    );
  };

  const fillDemo = (role: 'admin' | 'student') => {
    setError('');
    if (role === 'admin') {
      setIdentifier('admin');
      setPassword('admin123');
    } else {
      setIdentifier('student');
      setPassword('student123');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-violet-800 text-white flex items-center justify-center shadow-sm">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-bold tracking-tight text-slate-900 font-display">
              Hostel Pro
            </span>
            <p className="text-xs text-slate-500">
              Room Allocation Management System
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-slate-900">
              Sign in to your portal
            </h1>
            <p className="mt-1 text-sm text-slate-600">{hostelName}</p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="login-identifier"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Email or username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter admin or student"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-700/20 focus:border-violet-700"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-10 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-700/20 focus:border-violet-700"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-800 rounded"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-sm font-medium text-white bg-violet-800 hover:bg-violet-900 rounded-lg transition-colors cursor-pointer"
            >
              Sign in
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-xs font-medium text-slate-700 mb-3">
              Demo Accounts (Click to autofill)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => fillDemo('admin')}
                className="text-left p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-violet-50 hover:border-violet-200 transition-colors cursor-pointer"
              >
                <p className="text-xs font-semibold text-slate-900">
                  Administrator Demo
                </p>
                <p className="mt-0.5 text-xs text-slate-600 font-mono">
                  admin / admin123
                </p>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('student')}
                className="text-left p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-violet-50 hover:border-violet-200 transition-colors cursor-pointer"
              >
                <p className="text-xs font-semibold text-slate-900">
                  Student Demo
                </p>
                <p className="mt-0.5 text-xs text-slate-600 font-mono">
                  student / student123
                </p>
              </button>
            </div>

            <div className="mt-4 flex items-start gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                Academic prototype note: Demo authentication and browser
                LocalStorage persistence are for local demonstration only and do
                not provide production security or multi-device synchronization.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
