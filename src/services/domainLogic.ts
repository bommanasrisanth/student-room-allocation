import type {
  ActivityItem,
  Allocation,
  Complaint,
  HostelDatabase,
  PaymentRecord,
  PaymentStatus,
  Room,
  RoomApplication,
  RoomStatus,
  Student,
} from '../types/hostel';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface ActionResult<T = HostelDatabase> {
  ok: boolean;
  message: string;
  data?: T;
}

export function formatINR(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(safe);
}

export function formatDate(isoDate?: string): string {
  if (!isoDate) return '—';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function computeRoomStatus(
  totalCapacity: number,
  occupiedBeds: number,
  currentStatus?: RoomStatus
): RoomStatus {
  if (currentStatus === 'Maintenance') return 'Maintenance';
  if (occupiedBeds <= 0) return 'Available';
  if (occupiedBeds >= totalCapacity) return 'Full';
  return 'Partially Occupied';
}

export function normalizeRoom(room: Room, forceNonMaintenance = false): Room {
  const cap = Math.max(1, Math.floor(room.totalCapacity));
  const occ = Math.min(cap, Math.max(0, Math.floor(room.occupiedBeds)));
  const avail = Math.max(0, cap - occ);
  const status = computeRoomStatus(
    cap,
    occ,
    forceNonMaintenance && room.status === 'Maintenance' ? 'Available' : room.status
  );
  return {
    ...room,
    totalCapacity: cap,
    occupiedBeds: occ,
    availableBeds: avail,
    status,
  };
}

export function reconcileRoomsWithAllocations(
  rooms: Room[],
  allocations: Allocation[]
): Room[] {
  const activeCountByRoom = new Map<string, number>();
  for (const alloc of allocations) {
    if (alloc.status === 'Active') {
      activeCountByRoom.set(
        alloc.roomId,
        (activeCountByRoom.get(alloc.roomId) ?? 0) + 1
      );
    }
  }
  return rooms.map((room) => {
    const occupied = activeCountByRoom.get(room.id) ?? 0;
    return normalizeRoom({
      ...room,
      occupiedBeds: occupied,
    });
  });
}

export function validateStudentInput(
  input: Omit<Student, 'id'>,
  existingStudents: Student[],
  editingId?: string
): ValidationResult {
  const sid = input.studentId.trim();
  const name = input.fullName.trim();
  const email = input.email.trim();
  const phone = input.phone.trim();

  if (!sid) return { valid: false, error: 'Please enter a student ID.' };
  if (!name) return { valid: false, error: 'Please enter the student full name.' };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) {
    return { valid: false, error: 'Please enter a valid 10-digit mobile number.' };
  }
  if (!input.department.trim()) {
    return { valid: false, error: 'Please select or enter a department.' };
  }
  if (!input.yearOfStudy.trim()) {
    return { valid: false, error: 'Please select year of study.' };
  }

  const duplicate = existingStudents.find(
    (s) => s.studentId.toLowerCase() === sid.toLowerCase() && s.id !== editingId
  );
  if (duplicate) {
    return {
      valid: false,
      error: `Student ID "${sid}" already exists. Please use a unique student ID.`,
    };
  }

  return { valid: true };
}

export function validateRoomInput(
  input: {
    roomNumber: string;
    block: string;
    floor: string;
    totalCapacity: number;
    occupiedBeds: number;
    monthlyFee: number;
    status: RoomStatus;
  },
  existingRooms: Room[],
  editingId?: string
): ValidationResult {
  const roomNo = input.roomNumber.trim();
  if (!roomNo) return { valid: false, error: 'Please enter a room number.' };
  if (!input.block.trim()) return { valid: false, error: 'Please enter a hostel block.' };
  if (!input.floor.trim()) return { valid: false, error: 'Please enter a floor.' };

  if (!Number.isInteger(input.totalCapacity) || input.totalCapacity <= 0) {
    return {
      valid: false,
      error: 'Room capacity must be a positive whole number.',
    };
  }
  if (input.occupiedBeds < 0) {
    return { valid: false, error: 'Occupied beds cannot be negative.' };
  }
  if (input.occupiedBeds > input.totalCapacity) {
    return {
      valid: false,
      error: 'Occupied beds cannot exceed total room capacity.',
    };
  }
  if (input.status === 'Maintenance' && input.occupiedBeds > 0) {
    return {
      valid: false,
      error: 'Rooms with active occupants cannot be marked as Maintenance.',
    };
  }
  if (!Number.isFinite(input.monthlyFee) || input.monthlyFee < 0) {
    return { valid: false, error: 'Monthly fee cannot be negative.' };
  }

  const duplicate = existingRooms.find(
    (r) =>
      r.roomNumber.toLowerCase() === roomNo.toLowerCase() && r.id !== editingId
  );
  if (duplicate) {
    return {
      valid: false,
      error: `Room number "${roomNo}" already exists. Please choose a different room number.`,
    };
  }

  return { valid: true };
}

export function canDeleteStudent(
  studentRecordId: string,
  allocations: Allocation[],
  payments: PaymentRecord[]
): ValidationResult {
  const hasActiveAlloc = allocations.some(
    (a) => a.studentRecordId === studentRecordId && a.status === 'Active'
  );
  if (hasActiveAlloc) {
    return {
      valid: false,
      error:
        'This student currently occupies a hostel bed. Please check out the student before deleting.',
    };
  }
  const hasUnpaid = payments.some(
    (p) => p.studentRecordId === studentRecordId && p.outstandingAmount > 0
  );
  if (hasUnpaid) {
    return {
      valid: false,
      error:
        'This student has pending fee balances. Clear or settle outstanding fees before deleting.',
    };
  }
  return { valid: true };
}

export function canDeleteRoom(
  roomId: string,
  allocations: Allocation[]
): ValidationResult {
  const hasActive = allocations.some(
    (a) => a.roomId === roomId && a.status === 'Active'
  );
  if (hasActive) {
    return {
      valid: false,
      error:
        'This room has active student allocations. Move or check out occupants before deleting.',
    };
  }
  return { valid: true };
}

export interface RoomRecommendation {
  room: Room;
  matchTier: 'Exact Match' | 'Preferred Block' | 'Matching Type (Other Block)' | 'Alternative Available';
}

export function recommendRoomsForApplication(
  application: Pick<RoomApplication, 'preferredBlock' | 'preferredRoomType'>,
  rooms: Room[]
): RoomRecommendation[] {
  const available = rooms.filter(
    (r) => r.status !== 'Maintenance' && r.availableBeds > 0
  );

  const scoreRoom = (r: Room): { score: number; tier: RoomRecommendation['matchTier'] } => {
    const sameBlock = r.block.toLowerCase() === application.preferredBlock.toLowerCase();
    const sameType = r.roomType === application.preferredRoomType;
    if (sameBlock && sameType) return { score: 4, tier: 'Exact Match' };
    if (sameBlock) return { score: 3, tier: 'Preferred Block' };
    if (sameType) return { score: 2, tier: 'Matching Type (Other Block)' };
    return { score: 1, tier: 'Alternative Available' };
  };

  return available
    .map((room) => {
      const { score, tier } = scoreRoom(room);
      return { room, matchTier: tier, score };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.room.availableBeds - a.room.availableBeds;
    })
    .map(({ room, matchTier }) => ({ room, matchTier }));
}

export function calculateExpectedCheckout(checkInDate: string, maxMonths: number): string {
  const base = new Date(checkInDate);
  if (Number.isNaN(base.getTime())) return checkInDate;
  base.setMonth(base.getMonth() + Math.max(1, maxMonths));
  return base.toISOString().slice(0, 10);
}

export function allocateRoomToStudent(
  db: HostelDatabase,
  params: {
    studentRecordId: string;
    roomId: string;
    applicationId?: string;
    checkInDate?: string;
    expectedCheckoutDate?: string;
  }
): ActionResult {
  const student = db.students.find((s) => s.id === params.studentRecordId);
  if (!student) {
    return { ok: false, message: 'Please select a valid student.' };
  }

  const room = db.rooms.find((r) => r.id === params.roomId);
  if (!room) {
    return { ok: false, message: 'Please select a valid room.' };
  }

  if (room.status === 'Maintenance') {
    return {
      ok: false,
      message: `Room ${room.roomNumber} is currently under maintenance and cannot be allocated.`,
    };
  }

  if (room.availableBeds <= 0 || room.occupiedBeds >= room.totalCapacity) {
    return {
      ok: false,
      message: `Room ${room.roomNumber} has no available beds.`,
    };
  }

  const existingActive = db.allocations.find(
    (a) => a.studentRecordId === student.id && a.status === 'Active'
  );
  if (existingActive) {
    return {
      ok: false,
      message: `${student.fullName} already has an active room allocation (${existingActive.roomNumber}). Use Room Change or check out first.`,
    };
  }

  const checkIn = params.checkInDate || todayISO();
  const expectedCheckout =
    params.expectedCheckoutDate ||
    calculateExpectedCheckout(checkIn, db.settings.maxStayMonths);

  const nextAllocNumber = db.allocations.length + 1;
  const newAllocation: Allocation = {
    id: `alloc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    allocationId: `ALC-${String(nextAllocNumber).padStart(4, '0')}`,
    studentRecordId: student.id,
    studentId: student.studentId,
    studentName: student.fullName,
    roomId: room.id,
    roomNumber: room.roomNumber,
    block: room.block,
    floor: room.floor,
    roomType: room.roomType,
    monthlyFee: room.monthlyFee,
    applicationId: params.applicationId,
    checkInDate: checkIn,
    expectedCheckoutDate: expectedCheckout,
    status: 'Active',
    checkedInConfirmed: true,
  };

  const nextAllocations = [newAllocation, ...db.allocations];
  const nextRooms = reconcileRoomsWithAllocations(db.rooms, nextAllocations);
  const nextApplications = db.applications.map((app) =>
    params.applicationId && app.id === params.applicationId
      ? { ...app, status: 'Allocated' as const }
      : app
  );

  return {
    ok: true,
    message: `Room ${room.roomNumber} allocated to ${student.fullName}.`,
    data: {
      ...db,
      allocations: nextAllocations,
      rooms: nextRooms,
      applications: nextApplications,
    },
  };
}

export function changeStudentRoom(
  db: HostelDatabase,
  allocationId: string,
  targetRoomId: string
): ActionResult {
  const currentAlloc = db.allocations.find((a) => a.id === allocationId);
  if (!currentAlloc || currentAlloc.status !== 'Active') {
    return { ok: false, message: 'Please select an active allocation to move.' };
  }

  if (currentAlloc.roomId === targetRoomId) {
    return { ok: false, message: 'Please select a different destination room.' };
  }

  const targetRoom = db.rooms.find((r) => r.id === targetRoomId);
  if (!targetRoom) {
    return { ok: false, message: 'Please select a valid destination room.' };
  }
  if (targetRoom.status === 'Maintenance') {
    return {
      ok: false,
      message: `Room ${targetRoom.roomNumber} is under maintenance and cannot accept residents.`,
    };
  }
  if (targetRoom.availableBeds <= 0 || targetRoom.occupiedBeds >= targetRoom.totalCapacity) {
    return {
      ok: false,
      message: `Room ${targetRoom.roomNumber} is already full.`,
    };
  }

  const today = todayISO();
  const nextAllocations: Allocation[] = db.allocations.map((a) =>
    a.id === currentAlloc.id
      ? { ...a, status: 'Checked Out', actualCheckoutDate: today }
      : a
  );

  const newAllocation: Allocation = {
    id: `alloc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    allocationId: `ALC-${String(db.allocations.length + 1).padStart(4, '0')}`,
    studentRecordId: currentAlloc.studentRecordId,
    studentId: currentAlloc.studentId,
    studentName: currentAlloc.studentName,
    roomId: targetRoom.id,
    roomNumber: targetRoom.roomNumber,
    block: targetRoom.block,
    floor: targetRoom.floor,
    roomType: targetRoom.roomType,
    monthlyFee: targetRoom.monthlyFee,
    applicationId: currentAlloc.applicationId,
    checkInDate: today,
    expectedCheckoutDate: currentAlloc.expectedCheckoutDate,
    status: 'Active',
    checkedInConfirmed: true,
  };

  const finalAllocations = [newAllocation, ...nextAllocations];
  const nextRooms = reconcileRoomsWithAllocations(db.rooms, finalAllocations);

  return {
    ok: true,
    message: `${currentAlloc.studentName} moved from Room ${currentAlloc.roomNumber} to Room ${targetRoom.roomNumber}.`,
    data: {
      ...db,
      allocations: finalAllocations,
      rooms: nextRooms,
    },
  };
}

export function checkoutStudent(
  db: HostelDatabase,
  allocationId: string,
  checkoutDate?: string
): ActionResult {
  const alloc = db.allocations.find((a) => a.id === allocationId);
  if (!alloc || alloc.status !== 'Active') {
    return { ok: false, message: 'Selected allocation is already closed.' };
  }

  const actualDate = checkoutDate || todayISO();
  const nextAllocations: Allocation[] = db.allocations.map((a) =>
    a.id === allocationId
      ? { ...a, status: 'Checked Out', actualCheckoutDate: actualDate }
      : a
  );
  const nextRooms = reconcileRoomsWithAllocations(db.rooms, nextAllocations);

  return {
    ok: true,
    message: `${alloc.studentName} checked out from Room ${alloc.roomNumber}.`,
    data: {
      ...db,
      allocations: nextAllocations,
      rooms: nextRooms,
    },
  };
}

export function computePaymentFields(totalFee: number, paidAmount: number): {
  valid: boolean;
  error?: string;
  outstandingAmount: number;
  paymentStatus: PaymentStatus;
} {
  if (!Number.isFinite(totalFee) || totalFee <= 0) {
    return {
      valid: false,
      error: 'Total fee must be greater than ₹0.',
      outstandingAmount: 0,
      paymentStatus: 'Pending',
    };
  }
  if (!Number.isFinite(paidAmount) || paidAmount < 0) {
    return {
      valid: false,
      error: 'Paid amount cannot be negative.',
      outstandingAmount: totalFee,
      paymentStatus: 'Pending',
    };
  }
  if (paidAmount > totalFee) {
    return {
      valid: false,
      error: 'Paid amount cannot exceed the total fee.',
      outstandingAmount: 0,
      paymentStatus: 'Paid',
    };
  }
  const outstandingAmount = Math.max(0, totalFee - paidAmount);
  let paymentStatus: PaymentStatus = 'Pending';
  if (outstandingAmount === 0) {
    paymentStatus = 'Paid';
  } else if (paidAmount > 0) {
    paymentStatus = 'Partially Paid';
  }

  return { valid: true, outstandingAmount, paymentStatus };
}

export function recordPaymentAmount(
  payment: PaymentRecord,
  amountToAdd: number,
  paymentDate?: string
): ActionResult<PaymentRecord> {
  if (!Number.isFinite(amountToAdd) || amountToAdd <= 0) {
    return { ok: false, message: 'Please enter a payment amount greater than ₹0.' };
  }
  const nextPaid = payment.paidAmount + amountToAdd;
  if (nextPaid > payment.totalFee) {
    return {
      ok: false,
      message: `Payment exceeds the outstanding balance of ${formatINR(payment.outstandingAmount)}.`,
    };
  }
  const summary = computePaymentFields(payment.totalFee, nextPaid);
  return {
    ok: true,
    message: `Payment of ${formatINR(amountToAdd)} recorded successfully.`,
    data: {
      ...payment,
      paidAmount: nextPaid,
      outstandingAmount: summary.outstandingAmount,
      paymentStatus: summary.paymentStatus,
      paymentDate: paymentDate || todayISO(),
    },
  };
}

export interface DashboardMetrics {
  totalStudents: number;
  totalRooms: number;
  totalBedCapacity: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyRate: number;
  pendingApplications: number;
  outstandingFees: number;
  openComplaints: number;
  blockBreakdown: Array<{
    block: string;
    totalBeds: number;
    occupiedBeds: number;
    availableBeds: number;
    roomsCount: number;
  }>;
}

export function computeDashboardMetrics(db: HostelDatabase): DashboardMetrics {
  const totalStudents = db.students.length;
  const totalRooms = db.rooms.length;
  const totalBedCapacity = db.rooms.reduce((sum, r) => sum + r.totalCapacity, 0);
  const occupiedBeds = db.rooms.reduce((sum, r) => sum + r.occupiedBeds, 0);
  const availableBeds = db.rooms.reduce((sum, r) => sum + r.availableBeds, 0);
  const occupancyRate =
    totalBedCapacity > 0 ? Math.round((occupiedBeds / totalBedCapacity) * 100) : 0;

  const pendingApplications = db.applications.filter(
    (a) => a.status === 'Pending'
  ).length;
  const outstandingFees = db.payments.reduce(
    (sum, p) => sum + Math.max(0, p.outstandingAmount),
    0
  );
  const openComplaints = db.complaints.filter(
    (c) => c.status !== 'Resolved'
  ).length;

  const blockMap = new Map<
    string,
    { block: string; totalBeds: number; occupiedBeds: number; availableBeds: number; roomsCount: number }
  >();
  for (const room of db.rooms) {
    const existing = blockMap.get(room.block) ?? {
      block: room.block,
      totalBeds: 0,
      occupiedBeds: 0,
      availableBeds: 0,
      roomsCount: 0,
    };
    existing.totalBeds += room.totalCapacity;
    existing.occupiedBeds += room.occupiedBeds;
    existing.availableBeds += room.availableBeds;
    existing.roomsCount += 1;
    blockMap.set(room.block, existing);
  }

  return {
    totalStudents,
    totalRooms,
    totalBedCapacity,
    occupiedBeds,
    availableBeds,
    occupancyRate,
    pendingApplications,
    outstandingFees,
    openComplaints,
    blockBreakdown: Array.from(blockMap.values()).sort((a, b) =>
      a.block.localeCompare(b.block)
    ),
  };
}

export function buildRecentActivities(db: HostelDatabase): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const app of db.applications) {
    items.push({
      id: `act-app-${app.id}`,
      title: `Application ${app.status}`,
      detail: `${app.studentName} (${app.studentId}) requested ${app.preferredRoomType} in ${app.preferredBlock}`,
      date: app.applicationDate,
      type: 'application',
    });
  }

  for (const alloc of db.allocations) {
    items.push({
      id: `act-alloc-${alloc.id}`,
      title: alloc.status === 'Active' ? 'Room Allocated' : 'Student Checked Out',
      detail:
        alloc.status === 'Active'
          ? `${alloc.studentName} assigned to Room ${alloc.roomNumber} (${alloc.block})`
          : `${alloc.studentName} checked out of Room ${alloc.roomNumber}`,
      date: alloc.actualCheckoutDate || alloc.checkInDate,
      type: 'allocation',
    });
  }

  for (const pay of db.payments) {
    if (pay.paidAmount > 0) {
      items.push({
        id: `act-pay-${pay.id}`,
        title: pay.paymentStatus === 'Paid' ? 'Fee Paid in Full' : 'Partial Fee Payment',
        detail: `${pay.studentName} paid ${formatINR(pay.paidAmount)} (${pay.feeType})`,
        date: pay.paymentDate || pay.createdDate,
        type: 'payment',
      });
    }
  }

  for (const comp of db.complaints) {
    items.push({
      id: `act-comp-${comp.id}`,
      title: `Complaint ${comp.status}`,
      detail: `${comp.category} issue in Room ${comp.roomNumber} reported by ${comp.studentName}`,
      date: comp.submissionDate,
      type: 'complaint',
    });
  }

  return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
}

export function hasActiveOrApprovedApplication(
  studentRecordId: string,
  applications: RoomApplication[],
  allocations: Allocation[]
): boolean {
  const hasActiveAlloc = allocations.some(
    (a) => a.studentRecordId === studentRecordId && a.status === 'Active'
  );
  if (hasActiveAlloc) return true;
  return applications.some(
    (app) =>
      app.studentRecordId === studentRecordId &&
      (app.status === 'Pending' || app.status === 'Approved')
  );
}
