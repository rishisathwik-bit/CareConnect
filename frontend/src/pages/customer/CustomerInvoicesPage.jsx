import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import { FileText, CreditCard, CheckCircle2, DollarSign, Calendar, ArrowRight, Printer, X } from 'lucide-react';

export default function CustomerInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [receiptInvoice, setReceiptInvoice] = useState(null);
  const { success, error } = useToast();

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices');
      if (res.success) {
        setInvoices(res.data);
      }
    } catch (err) {
      error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (invoiceId) => {
    try {
      const res = await api.post(`/invoices/${invoiceId}/pay`, {
        paymentMethod: 'Credit Card (Simulated)'
      });
      if (res.success) {
        success('Invoice paid successfully!');
        fetchInvoices();
      }
    } catch (err) {
      error(err.message || 'Payment simulation failed');
    }
  };

  if (loading) {
    return <div className="max-w-5xl mx-auto p-12 text-center text-slate-500">Loading invoices...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Invoices & Receipts</h1>
          <p className="text-xs text-slate-500 mt-1">Review service billing statements, tax receipts, and payment statuses.</p>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold">No invoices generated yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((inv) => (
            <div
              key={inv._id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:shadow-md transition"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="font-extrabold text-slate-900 text-base">
                    {inv.invoiceNumber}
                  </span>
                  <StatusBadge status={inv.paymentStatus} />
                </div>

                <div className="text-xs text-slate-500 space-y-0.5">
                  <div>
                    Provider: <strong className="text-slate-700">{inv.provider?.name}</strong>
                  </div>
                  <div>
                    Issued: {new Date(inv.createdAt).toLocaleDateString()}
                    {inv.transactionId && ` • Txn ID: ${inv.transactionId}`}
                  </div>
                </div>

                {/* Line items preview */}
                <div className="text-xs text-slate-600 space-y-1 pt-2">
                  {inv.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                      <span>{item.description} (${item.amount})</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-right flex flex-col items-end justify-between self-stretch sm:self-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Amount</span>
                  <span className="text-2xl font-extrabold text-slate-900">${inv.totalAmount}</span>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => setReceiptInvoice(inv)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>Receipt</span>
                  </button>

                  {inv.paymentStatus === 'pending' ? (
                    <button
                      onClick={() => handlePay(inv._id)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 transition flex items-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Pay Now</span>
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 px-2">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Settled
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Printable Receipt Modal */}
      {receiptInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Official Service Receipt</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptInvoice(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl p-5 space-y-4 text-xs bg-white">
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div>
                  <span className="text-lg font-black text-indigo-600">CareConnect</span>
                  <span className="block text-[10px] text-slate-400">Home Operations Platform</span>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-slate-800">{receiptInvoice.invoiceNumber}</div>
                  <div className="text-slate-400 text-[10px]">
                    {new Date(receiptInvoice.createdAt).toLocaleDateString()}
                  </div>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800">
                    {receiptInvoice.paymentStatus}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-2 border-b border-slate-100 text-[11px]">
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[9px]">Client / Account:</span>
                  <strong className="text-slate-800">{receiptInvoice.customer?.name || 'Customer'}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block uppercase font-bold text-[9px]">Service Provider:</span>
                  <strong className="text-slate-800">{receiptInvoice.provider?.name || 'Verified Pro'}</strong>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-slate-400 uppercase font-bold text-[9px] block">Itemized Breakdown</span>
                {receiptInvoice.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between py-1 border-b border-slate-50 text-slate-700">
                    <span>{it.description}</span>
                    <span className="font-bold text-slate-900">${it.amount?.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-100 text-slate-500 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${receiptInvoice.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Operations Fee</span>
                  <span>${receiptInvoice.platformFee?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${receiptInvoice.tax?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total</span>
                  <span className="text-indigo-600">${receiptInvoice.totalAmount?.toFixed(2)}</span>
                </div>
              </div>

              {receiptInvoice.transactionId && (
                <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 text-center font-mono">
                  Transaction Ref: {receiptInvoice.transactionId} • Method: {receiptInvoice.paymentMethod || 'Simulated Card'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
