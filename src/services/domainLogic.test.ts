import test from 'node:test';
import assert from 'node:assert/strict';
import {
  allocateRoomToStudent,
  canDeleteRoom,
  canDeleteStudent,
  changeStudentRoom,
  checkoutStudent,
  computeDashboardMetrics,
  computePaymentFields,
  recommendRoomsForApplication,
  recordPaymentAmount,
  validateRoomInput,
  validateStudentInput,
} from './domainLogic';
import type { HostelDatabase, Room, Student } from '../types/hostel';

function makeBaseDb(): HostelDatabase {
  const students: Student[] = [
    {
      id: 'stu-1',
      studentId: 'STU-101',
      fullName: 'Aarav Sharma',
      email: 'aarav@example.edu',
      phone: '9876543210',
      department: 'Computer Science',
      yearOfStudy: '2nd Year',
      joiningDate: '2026-07-15',
      accountStatus: 'Active',
    },
    {
      id: 'stu-2',
      studentId: 'STU-102',
      fullName: 'Diya Nair',
      email: 'diya@example.edu',
      phone: '9876543211',
      department: 'Electronics',
      yearOfStudy: '3rd Year',
      joiningDate: '2026-07-16',
      accountStatus: 'Active',
    },
  ];

  const rooms: Room[] = [
    {
      id: 'room-1',
      roomNumber: 'A-101',
      block: 'Block A',
      floor: '1st Floor',
      roomType: 'Double',
      totalCapacity: 2,
      occupiedBeds: 0,
      availableBeds: 2,
      monthlyFee: 6500,
      facilities: ['Wi-Fi', 'Study Desk'],
      status: 'Available',
    },
    {
      id: 'room-2',
      roomNumber: 'B-201',
      block: 'Block B',
      floor: '2nd Floor',
      roomType: 'Single',
      totalCapacity: 1,
      occupiedBeds: 1,
      availableBeds: 0,
      monthlyFee: 9000,
      facilities: ['Wi-Fi', 'Attached Bath'],
      status: 'Full',
    },
    {
      id: 'room-3',
      roomNumber: 'A-102',
      block: 'Block A',
      floor: '1st Floor',
      roomType: 'Single',
      totalCapacity: 1,
      occupiedBeds: 0,
      availableBeds: 1,
      monthlyFee: 9000,
      facilities: ['Wi-Fi'],
      status: 'Maintenance',
    },
    {
      id: 'room-4',
      roomNumber: 'C-101',
      block: 'Block C',
      floor: '1st Floor',
      roomType: 'Double',
      totalCapacity: 2,
      occupiedBeds: 0,
      availableBeds: 2,
      monthlyFee: 6500,
      facilities: ['Wi-Fi'],
      status: 'Available',
    },
  ];

  return {
    students,
    rooms,
    applications: [
      {
        id: 'app-1',
        applicationId: 'APP-0001',
        studentRecordId: 'stu-1',
        studentId: 'STU-101',
        studentName: 'Aarav Sharma',
        email: 'aarav@example.edu',
        phone: '9876543210',
        department: 'Computer Science',
        yearOfStudy: '2nd Year',
        applicationDate: '2026-08-01',
        preferredRoomType: 'Double',
        preferredBlock: 'Block A',
        remarks: 'Near study hall',
        adminRemarks: 'Verified enrollment',
        status: 'Approved',
      },
    ],
    allocations: [
      {
        id: 'alloc-existing',
        allocationId: 'ALC-0001',
        studentRecordId: 'stu-2',
        studentId: 'STU-102',
        studentName: 'Diya Nair',
        roomId: 'room-2',
        roomNumber: 'B-201',
        block: 'Block B',
        floor: '2nd Floor',
        roomType: 'Single',
        monthlyFee: 9000,
        checkInDate: '2026-08-01',
        expectedCheckoutDate: '2027-06-01',
        status: 'Active',
        checkedInConfirmed: true,
      },
    ],
    payments: [
      {
        id: 'pay-1',
        invoiceNumber: 'INV-2026-001',
        studentRecordId: 'stu-2',
        studentId: 'STU-102',
        studentName: 'Diya Nair',
        feeType: 'Monthly hostel fee',
        description: 'August 2026 Hostel Fee',
        totalFee: 9000,
        paidAmount: 4000,
        outstandingAmount: 5000,
        paymentDate: '2026-08-02',
        createdDate: '2026-08-01',
        paymentStatus: 'Partially Paid',
      },
    ],
    complaints: [
      {
        id: 'comp-1',
        complaintId: 'CMP-001',
        studentRecordId: 'stu-2',
        studentId: 'STU-102',
        studentName: 'Diya Nair',
        roomNumber: 'B-201',
        category: 'Electrical',
        description: 'Ceiling fan regulator noisy',
        priority: 'Medium',
        submissionDate: '2026-08-05',
        status: 'Submitted',
      },
    ],
    settings: {
      hostelName: 'Hostel Pro Residence',
      adminName: 'Dr. Meera Iyer',
      adminEmail: 'warden@hostelpro.edu.in',
      adminPhone: '9811002200',
      defaultMonthlyFee: 6500,
      securityDeposit: 10000,
      maxStayMonths: 11,
    },
  };
}

test('student validation rejects duplicate student IDs', () => {
  const db = makeBaseDb();
  const res = validateStudentInput(
    {
      studentId: 'stu-101',
      fullName: 'Duplicate Student',
      email: 'dup@example.edu',
      phone: '9876543219',
      department: 'Mechanical',
      yearOfStudy: '1st Year',
      joiningDate: '2026-08-01',
      accountStatus: 'Active',
    },
    db.students
  );
  assert.equal(res.valid, false);
  assert.match(res.error ?? '', /already exists/i);
});

test('room validation rejects duplicate room numbers and invalid capacity', () => {
  const db = makeBaseDb();
  const dupRes = validateRoomInput(
    {
      roomNumber: 'A-101',
      block: 'Block A',
      floor: '1st Floor',
      totalCapacity: 2,
      occupiedBeds: 0,
      monthlyFee: 6000,
      status: 'Available',
    },
    db.rooms
  );
  assert.equal(dupRes.valid, false);

  const capRes = validateRoomInput(
    {
      roomNumber: 'A-999',
      block: 'Block A',
      floor: '1st Floor',
      totalCapacity: 2,
      occupiedBeds: 3,
      monthlyFee: 6000,
      status: 'Full',
    },
    db.rooms
  );
  assert.equal(capRes.valid, false);
});

test('room recommendations prioritize preferred block and type', () => {
  const db = makeBaseDb();
  const recs = recommendRoomsForApplication(
    { preferredBlock: 'Block A', preferredRoomType: 'Double' },
    db.rooms
  );
  assert.equal(recs.length, 2); // excludes Full B-201 and Maintenance A-102
  assert.equal(recs[0].room.roomNumber, 'A-101');
  assert.equal(recs[0].matchTier, 'Exact Match');
  assert.equal(recs[1].room.roomNumber, 'C-101');
});

test('allocating room updates occupancy, prevents full/maintenance/duplicate allocation', () => {
  const db = makeBaseDb();

  // Block full room
  const fullAttempt = allocateRoomToStudent(db, {
    studentRecordId: 'stu-1',
    roomId: 'room-2',
    applicationId: 'app-1',
  });
  assert.equal(fullAttempt.ok, false);

  // Block maintenance room
  const maintAttempt = allocateRoomToStudent(db, {
    studentRecordId: 'stu-1',
    roomId: 'room-3',
    applicationId: 'app-1',
  });
  assert.equal(maintAttempt.ok, false);

  // Block duplicate active allocation for stu-2
  const dupAttempt = allocateRoomToStudent(db, {
    studentRecordId: 'stu-2',
    roomId: 'room-1',
  });
  assert.equal(dupAttempt.ok, false);

  // Valid allocation
  const success = allocateRoomToStudent(db, {
    studentRecordId: 'stu-1',
    roomId: 'room-1',
    applicationId: 'app-1',
  });
  assert.equal(success.ok, true);
  assert.ok(success.data);

  const updatedRoom = success.data.rooms.find((r) => r.id === 'room-1');
  assert.equal(updatedRoom?.occupiedBeds, 1);
  assert.equal(updatedRoom?.availableBeds, 1);
  assert.equal(updatedRoom?.status, 'Partially Occupied');

  const updatedApp = success.data.applications.find((a) => a.id === 'app-1');
  assert.equal(updatedApp?.status, 'Allocated');
});

test('room change atomically releases old bed and reserves new bed', () => {
  const db = makeBaseDb();
  const moved = changeStudentRoom(db, 'alloc-existing', 'room-1');
  assert.equal(moved.ok, true);
  assert.ok(moved.data);

  const oldRoom = moved.data.rooms.find((r) => r.id === 'room-2');
  const newRoom = moved.data.rooms.find((r) => r.id === 'room-1');
  assert.equal(oldRoom?.occupiedBeds, 0);
  assert.equal(oldRoom?.availableBeds, 1);
  assert.equal(oldRoom?.status, 'Available');
  assert.equal(newRoom?.occupiedBeds, 1);
  assert.equal(newRoom?.availableBeds, 1);
});

test('checkout closes allocation, frees bed, and preserves history', () => {
  const db = makeBaseDb();
  const res = checkoutStudent(db, 'alloc-existing', '2026-09-10');
  assert.equal(res.ok, true);
  assert.ok(res.data);

  const oldRoom = res.data.rooms.find((r) => r.id === 'room-2');
  assert.equal(oldRoom?.occupiedBeds, 0);
  assert.equal(oldRoom?.availableBeds, 1);

  const closedAlloc = res.data.allocations.find((a) => a.id === 'alloc-existing');
  assert.equal(closedAlloc?.status, 'Checked Out');
  assert.equal(closedAlloc?.actualCheckoutDate, '2026-09-10');
});

test('dependency checks prevent deleting occupied room or active student', () => {
  const db = makeBaseDb();
  assert.equal(canDeleteRoom('room-2', db.allocations).valid, false);
  assert.equal(canDeleteRoom('room-1', db.allocations).valid, true);
  assert.equal(canDeleteStudent('stu-2', db.allocations, db.payments).valid, false);
  assert.equal(canDeleteStudent('stu-1', db.allocations, db.payments).valid, true);
});

test('payment calculations and partial payments enforce bounds', () => {
  const db = makeBaseDb();
  const p = db.payments[0];

  const overpay = recordPaymentAmount(p, 6000);
  assert.equal(overpay.ok, false);

  const partial = recordPaymentAmount(p, 2000, '2026-08-10');
  assert.equal(partial.ok, true);
  assert.equal(partial.data?.paidAmount, 6000);
  assert.equal(partial.data?.outstandingAmount, 3000);
  assert.equal(partial.data?.paymentStatus, 'Partially Paid');

  const full = recordPaymentAmount(partial.data!, 3000, '2026-08-15');
  assert.equal(full.ok, true);
  assert.equal(full.data?.outstandingAmount, 0);
  assert.equal(full.data?.paymentStatus, 'Paid');

  const invalid = computePaymentFields(5000, -100);
  assert.equal(invalid.valid, false);
});

test('dashboard metrics compute live totals from stored entities', () => {
  const db = makeBaseDb();
  const metrics = computeDashboardMetrics(db);
  assert.equal(metrics.totalStudents, 2);
  assert.equal(metrics.totalRooms, 4);
  assert.equal(metrics.totalBedCapacity, 6);
  assert.equal(metrics.occupiedBeds, 1);
  assert.equal(metrics.availableBeds, 5);
  assert.equal(metrics.outstandingFees, 5000);
  assert.equal(metrics.openComplaints, 1);
});
