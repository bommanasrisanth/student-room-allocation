import React, { useCallback, useState } from 'react';
import {
  loadDatabase,
  loadSession,
  resetDemoDatabase,
  saveDatabase,
  saveSession,
} from './services/storage';
import type { AuthSession, HostelDatabase, ToastNotice } from './types/hostel';
import { LoginScreen } from './components/LoginScreen';
import {
  LayoutShell,
  type ActiveTab,
  type AdminTab,
  type StudentTab,
} from './components/LayoutShell';
import { ToastContainer } from './components/ui/CommonUI';

import { AdminDashboard } from './components/admin/AdminDashboard';
import { StudentManagement } from './components/admin/StudentManagement';
import { RoomManagement } from './components/admin/RoomManagement';
import { ApplicationManagement } from './components/admin/ApplicationManagement';
import { RoomAllocation } from './components/admin/RoomAllocation';
import { FeesAndPayments } from './components/admin/FeesAndPayments';
import { ComplaintManagement } from './components/admin/ComplaintManagement';
import { AdminSettings } from './components/admin/AdminSettings';

import { StudentDashboard } from './components/student/StudentDashboard';
import { StudentApplicationForm } from './components/student/StudentApplicationForm';
import { StudentRoomAvailability } from './components/student/StudentRoomAvailability';
import { StudentMyApplication } from './components/student/StudentMyApplication';
import { StudentMyRoom } from './components/student/StudentMyRoom';
import { StudentProfile } from './components/student/StudentProfile';
import { StudentComplaints } from './components/student/StudentComplaints';

export default function App() {
  const [db, setDb] = useState<HostelDatabase>(() => loadDatabase());
  const [session, setSession] = useState<AuthSession | null>(() => loadSession());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [preselectedAppId, setPreselectedAppId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastNotice[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (kind: 'success' | 'error' | 'info', message: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-1), { id, kind, message }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3200);
    },
    []
  );

  const handleUpdateDb = useCallback((nextDb: HostelDatabase) => {
    setDb(nextDb);
    saveDatabase(nextDb);
  }, []);

  const handleLogin = (nextSession: AuthSession) => {
    setSession(nextSession);
    saveSession(nextSession);
    setActiveTab('dashboard');
    notify('info', `Signed in as ${nextSession.displayName}.`);
  };

  const handleLogout = () => {
    setSession(null);
    saveSession(null);
    setActiveTab('dashboard');
  };

  const handleResetDemoData = () => {
    const fresh = resetDemoDatabase();
    setDb(fresh);
    notify('success', 'Demonstration data restored to initial defaults.');
  };

  if (!session) {
    return (
      <>
        <LoginScreen
          students={db.students}
          hostelName={db.settings.hostelName}
          onLogin={handleLogin}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  if (session.role === 'admin') {
    const adminTab = activeTab as AdminTab;
    return (
      <>
        <LayoutShell
          session={session}
          hostelName={db.settings.hostelName}
          activeTab={adminTab}
          onSelectTab={(t) => setActiveTab(t)}
          onLogout={handleLogout}
        >
          {adminTab === 'dashboard' && (
            <AdminDashboard db={db} onNavigate={(t) => setActiveTab(t)} />
          )}
          {adminTab === 'students' && (
            <StudentManagement
              db={db}
              onUpdateDb={handleUpdateDb}
              onNotify={notify}
            />
          )}
          {adminTab === 'rooms' && (
            <RoomManagement
              db={db}
              onUpdateDb={handleUpdateDb}
              onNotify={notify}
            />
          )}
          {adminTab === 'applications' && (
            <ApplicationManagement
              db={db}
              onUpdateDb={handleUpdateDb}
              onNotify={notify}
              onNavigateToAllocation={(appId) => {
                setPreselectedAppId(appId);
                setActiveTab('allocations');
              }}
              onNavigateTab={(t) => setActiveTab(t)}
            />
          )}
          {adminTab === 'allocations' && (
            <RoomAllocation
              db={db}
              preselectedApplicationId={preselectedAppId}
              onClearPreselection={() => setPreselectedAppId(null)}
              onUpdateDb={handleUpdateDb}
              onNotify={notify}
            />
          )}
          {adminTab === 'fees' && (
            <FeesAndPayments
              db={db}
              onUpdateDb={handleUpdateDb}
              onNotify={notify}
            />
          )}
          {adminTab === 'complaints' && (
            <ComplaintManagement
              db={db}
              onUpdateDb={handleUpdateDb}
              onNotify={notify}
            />
          )}
          {adminTab === 'settings' && (
            <AdminSettings
              db={db}
              onUpdateDb={handleUpdateDb}
              onResetDemoData={handleResetDemoData}
              onNotify={notify}
            />
          )}
        </LayoutShell>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // Student Portal (role-isolated to the logged-in student record)
  const studentRecord =
    db.students.find((s) => s.id === session.studentRecordId) ??
    db.students.find((s) => s.username === 'student') ??
    db.students[0];

  if (!studentRecord) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-md text-center">
          <p className="text-sm text-slate-700 mb-4">
            Student profile could not be loaded. Please sign in again.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-white bg-violet-800 rounded-lg"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const studentTab = activeTab as StudentTab;

  return (
    <>
      <LayoutShell
        session={session}
        hostelName={db.settings.hostelName}
        activeTab={studentTab}
        onSelectTab={(t) => setActiveTab(t)}
        onLogout={handleLogout}
      >
        {studentTab === 'dashboard' && (
          <StudentDashboard
            db={db}
            student={studentRecord}
            onNavigate={(t) => setActiveTab(t)}
          />
        )}
        {studentTab === 'apply' && (
          <StudentApplicationForm
            db={db}
            student={studentRecord}
            onUpdateDb={handleUpdateDb}
            onNotify={notify}
            onNavigate={(t) => setActiveTab(t)}
          />
        )}
        {studentTab === 'availability' && <StudentRoomAvailability db={db} />}
        {studentTab === 'my-application' && (
          <StudentMyApplication
            db={db}
            student={studentRecord}
            onNavigate={(t) => setActiveTab(t)}
          />
        )}
        {studentTab === 'my-room' && (
          <StudentMyRoom
            db={db}
            student={studentRecord}
            onNavigate={(t) => setActiveTab(t)}
          />
        )}
        {studentTab === 'profile' && (
          <StudentProfile
            db={db}
            student={studentRecord}
            onUpdateDb={handleUpdateDb}
            onUpdateDisplayName={(name) => {
              const nextSession = { ...session, displayName: name };
              setSession(nextSession);
              saveSession(nextSession);
            }}
            onNotify={notify}
          />
        )}
        {studentTab === 'complaints' && (
          <StudentComplaints
            db={db}
            student={studentRecord}
            onUpdateDb={handleUpdateDb}
            onNotify={notify}
          />
        )}
      </LayoutShell>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
