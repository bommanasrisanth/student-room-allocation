export type UserRole = 'admin' | 'student';

export type AccountStatus = 'Active' | 'Inactive' | 'Graduated';

export type RoomType = 'Single' | 'Double' | 'Triple' | 'Shared';

export type RoomStatus = 'Available' | 'Partially Occupied' | 'Full' | 'Maintenance';

export type ApplicationStatus = 'Pending' | 'Approved' | 'Rejected' | 'Allocated';

export type AllocationStatus = 'Active' | 'Checked Out';

export type FeeType = 'Monthly hostel fee' | 'Security deposit' | 'Other charges';

export type PaymentStatus = 'Paid' | 'Partially Paid' | 'Pending';

export type ComplaintCategory =
  | 'Electrical'
  | 'Plumbing'
  | 'Cleaning'
  | 'Furniture'
  | 'Internet'
  | 'Other';

export type ComplaintPriority = 'Low' | 'Medium' | 'High';

export type ComplaintStatus = 'Submitted' | 'In Progress' | 'Resolved';

export interface Student {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  yearOfStudy: string;
  joiningDate: string;
  accountStatus: AccountStatus;
  username?: string;
}

export interface Room {
  id: string;
  roomNumber: string;
  block: string;
  floor: string;
  roomType: RoomType;
  totalCapacity: number;
  occupiedBeds: number;
  availableBeds: number;
  monthlyFee: number;
  facilities: string[];
  status: RoomStatus;
}

export interface RoomApplication {
  id: string;
  applicationId: string;
  studentRecordId: string;
  studentId: string;
  studentName: string;
  email: string;
  phone: string;
  department: string;
  yearOfStudy: string;
  applicationDate: string;
  preferredRoomType: RoomType;
  preferredBlock: string;
  remarks: string;
  adminRemarks: string;
  status: ApplicationStatus;
}

export interface Allocation {
  id: string;
  allocationId: string;
  studentRecordId: string;
  studentId: string;
  studentName: string;
  roomId: string;
  roomNumber: string;
  block: string;
  floor: string;
  roomType: RoomType;
  monthlyFee: number;
  applicationId?: string;
  checkInDate: string;
  expectedCheckoutDate: string;
  actualCheckoutDate?: string;
  status: AllocationStatus;
  checkedInConfirmed: boolean;
}

export interface PaymentRecord {
  id: string;
  invoiceNumber: string;
  studentRecordId: string;
  studentId: string;
  studentName: string;
  feeType: FeeType;
  description: string;
  totalFee: number;
  paidAmount: number;
  outstandingAmount: number;
  paymentDate?: string;
  createdDate: string;
  paymentStatus: PaymentStatus;
}

export interface Complaint {
  id: string;
  complaintId: string;
  studentRecordId: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  category: ComplaintCategory;
  description: string;
  priority: ComplaintPriority;
  submissionDate: string;
  status: ComplaintStatus;
  resolutionNotes?: string;
}

export interface HostelSettings {
  hostelName: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  defaultMonthlyFee: number;
  securityDeposit: number;
  maxStayMonths: number;
}

export interface AuthSession {
  role: UserRole;
  username: string;
  displayName: string;
  studentRecordId?: string;
}

export interface HostelDatabase {
  students: Student[];
  rooms: Room[];
  applications: RoomApplication[];
  allocations: Allocation[];
  payments: PaymentRecord[];
  complaints: Complaint[];
  settings: HostelSettings;
}

export interface ActivityItem {
  id: string;
  title: string;
  detail: string;
  date: string;
  type: 'application' | 'allocation' | 'payment' | 'complaint';
}

export interface ToastNotice {
  id: string;
  kind: 'success' | 'error' | 'info';
  message: string;
}
