import React, { useMemo, useState } from 'react';
import {
  CreditCard,
  IndianRupee,
  Plus,
  Printer,
  Search,
} from 'lucide-react';
import {
  computePaymentFields,
  formatDate,
  formatINR,
  recordPaymentAmount,
  todayISO,
} from '../../services/domainLogic';
import type {
  FeeType,
  HostelDatabase,
  PaymentRecord,
} from '../../types/hostel';
import {
  EmptyState,
  Modal,
  PageHeader,
  StatusBadge,
  getStatusTone,
} from '../ui/CommonUI';

interface FeesAndPaymentsProps {
  db: HostelDatabase;
  onUpdateDb: (next: HostelDatabase) => void;
  onNotify: (kind: 'success' | 'error' | 'info', message: string) => void;
}

const FEE_TYPES: FeeType[] = [
  'Monthly hostel fee',
  'Security deposit',
  'Other charges',
];

export function FeesAndPayments({
  db,
  onUpdateDb,
  onNotify,
}: FeesAndPaymentsProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [createOpen, setCreateOpen] = useState(false);
  const [studentRecordId, setStudentRecordId] = useState(
    db.students[0]?.id || ''
  );
  const [feeType, setFeeType] = useState<FeeType>('Monthly hostel fee');
  const [description, setDescription] = useState('');
  const [totalFee, setTotalFee] = useState<number>(db.settings.defaultMonthlyFee);
  const [initialPaid, setInitialPaid] = useState<number>(0);
  const [createError, setCreateError] = useState('');

  const [payModalTarget, setPayModalTarget] = useState<PaymentRecord | null>(
    null
  );
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payDate, setPayDate] = useState<string>(todayISO());
  const [payError, setPayError] = useState('');

  const [invoiceTarget, setInvoiceTarget] = useState<PaymentRecord | null>(
    null
  );

  const summary = useMemo(() => {
    return db.payments.reduce(
      (acc, p) => {
        acc.totalBilled += p.totalFee;
        acc.totalCollected += p.paidAmount;
        acc.totalOutstanding += p.outstandingAmount;
        return acc;
      },
      { totalBilled: 0, totalCollected: 0, totalOutstanding: 0 }
    );
  }, [db.payments]);

  const filteredPayments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...db.payments]
      .filter((p) => {
        const matchesSearch =
          !q ||
          p.studentName.toLowerCase().includes(q) ||
          p.studentId.toLowerCase().includes(q) ||
          p.invoiceNumber.toLowerCase().includes(q);
        const matchesStatus =
          statusFilter === 'All' || p.paymentStatus === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => b.createdDate.localeCompare(a.createdDate));
  }, [db.payments, search, statusFilter]);

  const openCreateModal = () => {
    setStudentRecordId(db.students[0]?.id || '');
    setFeeType('Monthly hostel fee');
    setDescription('Hostel Monthly Fee');
    setTotalFee(db.settings.defaultMonthlyFee);
    setInitialPaid(0);
    setCreateError('');
    setCreateOpen(true);
  };

  const handleCreateFee = (e: React.FormEvent) => {
    e.preventDefault();
    const student = db.students.find((s) => s.id === studentRecordId);
    if (!student) {
      setCreateError('Please select a valid student.');
      return;
    }

    const calc = computePaymentFields(Number(totalFee), Number(initialPaid));
    if (!calc.valid) {
      setCreateError(calc.error || 'Please check the fee amounts.');
      return;
    }

    const nextNumber = db.payments.length + 1001;
    const newRecord: PaymentRecord = {
      id: `pay-${Date.now()}`,
      invoiceNumber: `INV-2026-${nextNumber}`,
      studentRecordId: student.id,
      studentId: student.studentId,
      studentName: student.fullName,
      feeType,
      description: description.trim() || feeType,
      totalFee: Number(totalFee),
      paidAmount: Number(initialPaid),
      outstandingAmount: calc.outstandingAmount,
      paymentDate: Number(initialPaid) > 0 ? todayISO() : undefined,
      createdDate: todayISO(),
      paymentStatus: calc.paymentStatus,
    };

    onUpdateDb({ ...db, payments: [newRecord, ...db.payments] });
    onNotify('success', `Fee record ${newRecord.invoiceNumber} created.`);
    setCreateOpen(false);
  };

  const openRecordPayment = (record: PaymentRecord) => {
    setPayModalTarget(record);
    setPayAmount(record.outstandingAmount);
    setPayDate(todayISO());
    setPayError('');
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalTarget) return;

    const result = recordPaymentAmount(
      payModalTarget,
      Number(payAmount),
      payDate
    );
    if (!result.ok || !result.data) {
      setPayError(result.message);
      return;
    }

    const nextPayments = db.payments.map((p) =>
      p.id === payModalTarget.id ? result.data! : p
    );
    onUpdateDb({ ...db, payments: nextPayments });
    onNotify('success', result.message);
    setPayModalTarget(null);
  };

  return (
    <div>
      <PageHeader
        title="Fees & Payments"
        subtitle="Manage hostel fee charges, record full or partial payments, track outstanding balances, and print invoices."
        action={
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-800 hover:bg-violet-900 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Create Fee Record
          </button>
        }
      />

      {/* Financial Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Total Billed</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 tabular-nums">
            {formatINR(summary.totalBilled)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Total Collected</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-700 tabular-nums">
            {formatINR(summary.totalCollected)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">
            Outstanding Balance
          </p>
          <p className="mt-1 text-2xl font-semibold text-amber-700 tabular-nums">
            {formatINR(summary.totalOutstanding)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            aria-label="Search fee records"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, ID, or invoice number..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg"
          />
        </div>
        <select
          aria-label="Filter by payment status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
        >
          <option value="All">All Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Partially Paid">Partially Paid</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      {filteredPayments.length === 0 ? (
        <EmptyState
          icon={<IndianRupee className="w-5 h-5" />}
          title="No fee records found"
          description="Create a fee record for a student to start tracking payments."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Invoice</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Fee Type</th>
                  <th className="py-3 px-4 text-right">Total Fee</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Outstanding</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredPayments.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                      {rec.invoiceNumber}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-900">
                        {rec.studentName}
                      </p>
                      <p className="text-xs font-mono text-slate-500">
                        {rec.studentId}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-slate-900">{rec.feeType}</p>
                      <p className="text-xs text-slate-500">
                        {rec.paymentDate
                          ? `Paid ${formatDate(rec.paymentDate)}`
                          : `Billed ${formatDate(rec.createdDate)}`}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-900">
                      {formatINR(rec.totalFee)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-emerald-700 font-medium">
                      {formatINR(rec.paidAmount)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-900 font-semibold">
                      {formatINR(rec.outstandingAmount)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge
                        label={rec.paymentStatus}
                        tone={getStatusTone(rec.paymentStatus)}
                      />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {rec.outstandingAmount > 0 && (
                          <button
                            type="button"
                            onClick={() => openRecordPayment(rec)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-violet-800 hover:bg-violet-900 rounded-lg cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Record Payment
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setInvoiceTarget(rec)}
                          aria-label={`Invoice for ${rec.invoiceNumber}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Invoice
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Fee Modal */}
      <Modal
        open={createOpen}
        title="Create Fee Record"
        onClose={() => setCreateOpen(false)}
      >
        <form onSubmit={handleCreateFee} className="space-y-4">
          {createError && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800"
            >
              {createError}
            </div>
          )}

          <div>
            <label
              htmlFor="fee-student"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Student
            </label>
            <select
              id="fee-student"
              value={studentRecordId}
              onChange={(e) => setStudentRecordId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            >
              {db.students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.studentId})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="fee-type"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Fee Type
              </label>
              <select
                id="fee-type"
                value={feeType}
                onChange={(e) => {
                  const val = e.target.value as FeeType;
                  setFeeType(val);
                  if (val === 'Security deposit') {
                    setTotalFee(db.settings.securityDeposit);
                  } else if (val === 'Monthly hostel fee') {
                    setTotalFee(db.settings.defaultMonthlyFee);
                  }
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              >
                {FEE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="fee-desc"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Description
              </label>
              <input
                id="fee-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. November 2026 Hostel Rent"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="fee-total"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Total Fee (₹)
              </label>
              <input
                id="fee-total"
                type="number"
                min={1}
                value={totalFee}
                onChange={(e) => setTotalFee(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg tabular-nums"
              />
            </div>
            <div>
              <label
                htmlFor="fee-initial-paid"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Initial Paid Amount (₹)
              </label>
              <input
                id="fee-initial-paid"
                type="number"
                min={0}
                value={initialPaid}
                onChange={(e) => setInitialPaid(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg tabular-nums"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-violet-800 hover:bg-violet-900 rounded-lg"
            >
              Create Fee Record
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        open={Boolean(payModalTarget)}
        title="Record Payment"
        onClose={() => setPayModalTarget(null)}
        maxWidth="max-w-md"
      >
        {payModalTarget && (
          <form onSubmit={handleRecordPayment} className="space-y-4">
            {payError && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800"
              >
                {payError}
              </div>
            )}

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-sm space-y-1">
              <p className="font-semibold text-slate-900">
                {payModalTarget.studentName} ({payModalTarget.invoiceNumber})
              </p>
              <p className="text-xs text-slate-600">{payModalTarget.feeType}</p>
              <p className="text-xs text-slate-700 tabular-nums">
                Total: {formatINR(payModalTarget.totalFee)} · Paid:{' '}
                {formatINR(payModalTarget.paidAmount)} · Outstanding:{' '}
                <span className="font-semibold text-amber-700">
                  {formatINR(payModalTarget.outstandingAmount)}
                </span>
              </p>
            </div>

            <div>
              <label
                htmlFor="pay-amount"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Amount Received (₹)
              </label>
              <input
                id="pay-amount"
                type="number"
                min={1}
                max={payModalTarget.outstandingAmount}
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg tabular-nums"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPayAmount(Math.ceil(payModalTarget.outstandingAmount / 2))
                  }
                  className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                >
                  50% Partial
                </button>
                <button
                  type="button"
                  onClick={() => setPayAmount(payModalTarget.outstandingAmount)}
                  className="px-2.5 py-1 text-xs font-medium text-violet-800 bg-violet-50 hover:bg-violet-100 rounded"
                >
                  Full Balance
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="pay-date"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Payment Date
              </label>
              <input
                id="pay-date"
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPayModalTarget(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-violet-800 hover:bg-violet-900 rounded-lg"
              >
                Save Payment
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Printable Invoice Modal */}
      <Modal
        open={Boolean(invoiceTarget)}
        title="Fee Invoice"
        onClose={() => setInvoiceTarget(null)}
        maxWidth="max-w-xl"
      >
        {invoiceTarget && (
          <div>
            <div
              id="printable-invoice"
              className="border border-slate-200 rounded-lg p-6 bg-white"
            >
              <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {db.settings.hostelName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official Fee Statement & Payment Receipt
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Invoice Number</p>
                  <p className="font-mono text-sm font-semibold text-slate-900">
                    {invoiceTarget.invoiceNumber}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Billed To</p>
                  <p className="font-semibold text-slate-900">
                    {invoiceTarget.studentName}
                  </p>
                  <p className="text-xs font-mono text-slate-600">
                    {invoiceTarget.studentId}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Issue Date</p>
                  <p className="text-slate-900">
                    {formatDate(invoiceTarget.createdDate)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Status: {invoiceTarget.paymentStatus}
                  </p>
                </div>
              </div>

              <table className="w-full text-sm my-4">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="py-2 text-left">Particulars</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3">
                      <p className="font-medium text-slate-900">
                        {invoiceTarget.feeType}
                      </p>
                      <p className="text-xs text-slate-500">
                        {invoiceTarget.description}
                      </p>
                    </td>
                    <td className="py-3 text-right tabular-nums font-medium text-slate-900">
                      {formatINR(invoiceTarget.totalFee)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="border-t border-slate-200 pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Total Charged</span>
                  <span className="tabular-nums">
                    {formatINR(invoiceTarget.totalFee)}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>
                    Amount Paid{' '}
                    {invoiceTarget.paymentDate
                      ? `(${formatDate(invoiceTarget.paymentDate)})`
                      : ''}
                  </span>
                  <span className="tabular-nums font-medium">
                    {formatINR(invoiceTarget.paidAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-semibold text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Outstanding Balance</span>
                  <span className="tabular-nums">
                    {formatINR(invoiceTarget.outstandingAmount)}
                  </span>
                </div>
              </div>

              <p className="mt-6 text-xs text-slate-400 text-center">
                Authorized by {db.settings.adminName} · {db.settings.adminEmail}
              </p>
            </div>

            <div className="mt-4 flex justify-end gap-3 no-print">
              <button
                type="button"
                onClick={() => setInvoiceTarget(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-800 hover:bg-violet-900 rounded-lg cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Invoice
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
