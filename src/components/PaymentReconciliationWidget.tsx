import React from 'react';
import { CreditCard, CheckCircle2, AlertTriangle, Smartphone, ShoppingBag } from 'lucide-react';
import { PaymentReconciliationData } from '../types';

interface PaymentReconciliationWidgetProps {
  data: PaymentReconciliationData;
  onChange: (updates: Partial<PaymentReconciliationData>) => void;
  isReadOnly?: boolean;
}

export const PaymentReconciliationWidget: React.FC<PaymentReconciliationWidgetProps> = ({
  data,
  onChange,
  isReadOnly = false,
}) => {
  const isBalanced = Math.abs(data.variance) <= 0.02;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-neutral-800 bg-neutral-950/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-neutral-100">
              Payment Gateway & Channel Reconciliation
            </h3>
            <p className="text-xs text-neutral-400">
              Cross-audit terminal batch slips, online deliveries, and POS registered revenue.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isBalanced ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Payment Channels In Balance</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Channel Variance: ${data.variance.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Payment Channels Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-neutral-950/70 p-3 rounded-xl border border-neutral-800">
            <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
              <span>Cash Total</span>
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-xs text-neutral-500">$</span>
              <input
                type="number"
                step="0.01"
                disabled={isReadOnly}
                value={data.cashTotal || ''}
                onChange={e => onChange({ cashTotal: parseFloat(e.target.value) || 0 })}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-6 pr-2 py-1.5 text-xs text-neutral-100 font-mono tabular-nums focus:outline-none focus:border-blue-400 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="bg-neutral-950/70 p-3 rounded-xl border border-neutral-800">
            <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-neutral-400" />
              <span>Card EDC Batches</span>
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-xs text-neutral-500">$</span>
              <input
                type="number"
                step="0.01"
                disabled={isReadOnly}
                value={data.cardTotal || ''}
                onChange={e => onChange({ cardTotal: parseFloat(e.target.value) || 0 })}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-6 pr-2 py-1.5 text-xs text-neutral-100 font-mono tabular-nums focus:outline-none focus:border-blue-400 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="bg-neutral-950/70 p-3 rounded-xl border border-neutral-800">
            <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-neutral-400" />
              <span>QR / UPI / Mobile</span>
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-xs text-neutral-500">$</span>
              <input
                type="number"
                step="0.01"
                disabled={isReadOnly}
                value={data.upiQrTotal || ''}
                onChange={e => onChange({ upiQrTotal: parseFloat(e.target.value) || 0 })}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-6 pr-2 py-1.5 text-xs text-neutral-100 font-mono tabular-nums focus:outline-none focus:border-blue-400 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="bg-neutral-950/70 p-3 rounded-xl border border-neutral-800">
            <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
              <ShoppingBag className="w-3 h-3 text-neutral-400" />
              <span>Online Delivery</span>
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-xs text-neutral-500">$</span>
              <input
                type="number"
                step="0.01"
                disabled={isReadOnly}
                value={data.onlineAggregatorTotal || ''}
                onChange={e => onChange({ onlineAggregatorTotal: parseFloat(e.target.value) || 0 })}
                placeholder="DoorDash/Uber"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-6 pr-2 py-1.5 text-xs text-neutral-100 font-mono tabular-nums focus:outline-none focus:border-blue-400 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="bg-neutral-950/70 p-3 rounded-xl border border-neutral-800 col-span-2 sm:col-span-1">
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">
              Other / Gift Cards
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-xs text-neutral-500">$</span>
              <input
                type="number"
                step="0.01"
                disabled={isReadOnly}
                value={data.otherTotal || ''}
                onChange={e => onChange({ otherTotal: parseFloat(e.target.value) || 0 })}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-6 pr-2 py-1.5 text-xs text-neutral-100 font-mono tabular-nums focus:outline-none focus:border-blue-400 disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Audit Comparison Strip */}
        <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="grid grid-cols-3 gap-6 w-full md:w-auto text-center md:text-left">
            <div>
              <span className="block text-[11px] text-neutral-400">Sum of Settlements</span>
              <span className="text-base sm:text-lg font-bold font-mono text-neutral-200 tabular-nums">
                ${data.calculatedTotalSales.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-neutral-400">POS Z-Report Total</span>
              <div className="relative inline-block">
                <span className="absolute left-1.5 top-0.5 text-xs text-neutral-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  disabled={isReadOnly}
                  value={data.posTotalSales || ''}
                  onChange={e => onChange({ posTotalSales: parseFloat(e.target.value) || 0 })}
                  className="w-28 bg-neutral-900 border border-neutral-700 rounded px-2 pl-4 py-0.5 text-sm font-bold font-mono text-neutral-100 tabular-nums focus:outline-none focus:border-blue-400 disabled:opacity-80"
                />
              </div>
            </div>
            <div>
              <span className="block text-[11px] text-neutral-400">Channel Discrepancy</span>
              <span
                className={`text-base sm:text-lg font-bold font-mono tabular-nums ${
                  isBalanced ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {data.variance > 0 ? `+$${data.variance.toFixed(2)}` : `$${data.variance.toFixed(2)}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
              <input
                type="checkbox"
                disabled={isReadOnly}
                checked={data.edcDiscrepanciesReported}
                onChange={e => onChange({ edcDiscrepanciesReported: e.target.checked })}
                className="rounded border-neutral-700 bg-neutral-800 text-blue-500 focus:ring-0 w-4 h-4"
              />
              <span>Report EDC hardware or network slips discrepancy</span>
            </label>
          </div>
        </div>

        {/* Discrepancy notes */}
        {!isBalanced && (
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
            <label className="block text-xs font-medium text-neutral-300">
              Channel Discrepancy Notes / Tip Adjustments
            </label>
            <textarea
              rows={2}
              disabled={isReadOnly}
              value={data.discrepancyNotes || ''}
              onChange={e => onChange({ discrepancyNotes: e.target.value })}
              placeholder="Explain any difference between POS gross and settlement slips (e.g. guest tip adjustments, offline batch delay)..."
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-400 disabled:opacity-60"
            />
          </div>
        )}
      </div>
    </div>
  );
};
