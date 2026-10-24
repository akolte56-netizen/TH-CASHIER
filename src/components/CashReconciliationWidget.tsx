import React from 'react';
import { Coins, AlertTriangle, CheckCircle2, DollarSign, Calculator, Lock } from 'lucide-react';
import { CashReconciliationData } from '../types';

interface CashReconciliationWidgetProps {
  data: CashReconciliationData;
  onChange: (updates: Partial<CashReconciliationData>) => void;
  onDenominationChange: (index: number, count: number) => void;
  isReadOnly?: boolean;
}

export const CashReconciliationWidget: React.FC<CashReconciliationWidgetProps> = ({
  data,
  onChange,
  onDenominationChange,
  isReadOnly = false,
}) => {
  const isShortage = data.variance < -0.01;
  const isExcess = data.variance > 0.01;
  const isExact = Math.abs(data.variance) <= 0.01;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-neutral-800 bg-neutral-950/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
              Cash Drawer Reconciliation
              {isReadOnly && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-normal text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
            </h3>
            <p className="text-xs text-neutral-400">
              Formula: Opening Float + Cash Sales - Refunds - Payouts - Safe Drops = Expected Cash
            </p>
          </div>
        </div>

        {/* Live Variance Summary Tag */}
        <div className="flex items-center gap-2">
          {isExact && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Exact Match · $0.00 Variance</span>
            </div>
          )}
          {isShortage && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Shortage: -${Math.abs(data.variance).toFixed(2)}</span>
            </div>
          )}
          {isExcess && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Excess: +${data.variance.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Step 1: Cash Accounting Inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-neutral-950/70 p-3 rounded-xl border border-neutral-800">
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">
              Opening Float ($)
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-xs text-neutral-500">$</span>
              <input
                type="number"
                step="0.01"
                disabled={isReadOnly}
                value={data.openingFloat || ''}
                onChange={e => onChange({ openingFloat: parseFloat(e.target.value) || 0 })}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-6 pr-2 py-1.5 text-xs text-neutral-100 font-mono tabular-nums focus:outline-none focus:border-amber-400 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="bg-neutral-950/70 p-3 rounded-xl border border-neutral-800">
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">
              Cash Sales (+)
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-xs text-neutral-500">$</span>
              <input
                type="number"
                step="0.01"
                disabled={isReadOnly}
                value={data.cashSales || ''}
                onChange={e => onChange({ cashSales: parseFloat(e.target.value) || 0 })}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-6 pr-2 py-1.5 text-xs text-neutral-100 font-mono tabular-nums focus:outline-none focus:border-amber-400 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="bg-neutral-950/70 p-3 rounded-xl border border-neutral-800">
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">
              Cash Refunds (-)
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-xs text-neutral-500">$</span>
              <input
                type="number"
                step="0.01"
                disabled={isReadOnly}
                value={data.cashRefunds || ''}
                onChange={e => onChange({ cashRefunds: parseFloat(e.target.value) || 0 })}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-6 pr-2 py-1.5 text-xs text-neutral-100 font-mono tabular-nums focus:outline-none focus:border-amber-400 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="bg-neutral-950/70 p-3 rounded-xl border border-neutral-800">
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">
              Cash Paid Out (-)
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-xs text-neutral-500">$</span>
              <input
                type="number"
                step="0.01"
                disabled={isReadOnly}
                value={data.cashPaidOut || ''}
                onChange={e => onChange({ cashPaidOut: parseFloat(e.target.value) || 0 })}
                placeholder="Petty cash"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-6 pr-2 py-1.5 text-xs text-neutral-100 font-mono tabular-nums focus:outline-none focus:border-amber-400 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="bg-neutral-950/70 p-3 rounded-xl border border-neutral-800 col-span-2 sm:col-span-1">
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">
              Interim Drops (-)
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-xs text-neutral-500">$</span>
              <input
                type="number"
                step="0.01"
                disabled={isReadOnly}
                value={data.cashDeposits || ''}
                onChange={e => onChange({ cashDeposits: parseFloat(e.target.value) || 0 })}
                placeholder="Safe drops"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-6 pr-2 py-1.5 text-xs text-neutral-100 font-mono tabular-nums focus:outline-none focus:border-amber-400 disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Denomination-Wise Breakdown Counter */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-amber-400" />
              Physical Till Denomination Count
            </h4>
            <div className="text-xs font-mono text-neutral-400">
              Sum: <span className="text-neutral-100 font-semibold tabular-nums">${data.physicalCashCount.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {data.denominationCounts.map((denom, idx) => (
              <div
                key={denom.denomination}
                className="p-2.5 bg-neutral-950/40 border border-neutral-800 rounded-xl flex items-center justify-between gap-2"
              >
                <div>
                  <span className="block text-xs font-medium text-neutral-200">{denom.label}</span>
                  <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
                    = ${denom.total.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => onDenominationChange(idx, Math.max(0, denom.count - 1))}
                      className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center text-xs font-mono transition-colors"
                    >
                      -
                    </button>
                  )}
                  <input
                    type="number"
                    min="0"
                    disabled={isReadOnly}
                    value={denom.count || ''}
                    placeholder="0"
                    onChange={e => onDenominationChange(idx, parseInt(e.target.value) || 0)}
                    className="w-12 text-center bg-neutral-900 border border-neutral-700 rounded py-1 text-xs text-neutral-100 font-mono tabular-nums focus:outline-none focus:border-amber-400 disabled:opacity-60"
                  />
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => onDenominationChange(idx, denom.count + 1)}
                      className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center text-xs font-mono transition-colors"
                    >
                      +
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 3: Comparison Matrix & Variance Callout */}
        <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="grid grid-cols-3 gap-6 w-full md:w-auto text-center md:text-left">
            <div>
              <span className="block text-[11px] text-neutral-400">Expected in Till</span>
              <span className="text-base sm:text-lg font-bold font-mono text-neutral-200 tabular-nums">
                ${data.expectedCash.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-neutral-400">Physical Count</span>
              <span className="text-base sm:text-lg font-bold font-mono text-neutral-200 tabular-nums">
                ${data.physicalCashCount.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-neutral-400">Net Variance</span>
              <span
                className={`text-base sm:text-lg font-bold font-mono tabular-nums ${
                  isExact ? 'text-emerald-400' : isShortage ? 'text-rose-400' : 'text-amber-400'
                }`}
              >
                {data.variance > 0 ? `+$${data.variance.toFixed(2)}` : `$${data.variance.toFixed(2)}`}
              </span>
            </div>
          </div>

          <div className="w-full md:w-auto text-xs text-neutral-400 bg-neutral-900/80 px-3.5 py-2.5 rounded-lg border border-neutral-800">
            {isExact ? (
              <p className="text-emerald-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Physical cash precisely balances with expected system sales.
              </p>
            ) : isShortage ? (
              <p className="text-rose-400 font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Cash shortage detected! Mandatory justification is required below.
              </p>
            ) : (
              <p className="text-amber-400 font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Cash excess detected! Mandatory explanation is required below.
              </p>
            )}
          </div>
        </div>

        {/* Mandatory Variance Justification Input */}
        {!isExact && (
          <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl space-y-2">
            <label className="block text-xs font-semibold text-rose-300">
              Mandatory Variance Justification <span className="text-rose-400">*</span>
            </label>
            <p className="text-[11px] text-neutral-400">
              Document reason for difference (e.g., coin change error, unrecorded emergency supplier payout, customer billing dispute):
            </p>
            <textarea
              rows={2}
              disabled={isReadOnly}
              value={data.varianceReason || ''}
              onChange={e => onChange({ varianceReason: e.target.value })}
              placeholder="State clear operational reason for cash shortage or excess..."
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-rose-400 disabled:opacity-60"
            />
          </div>
        )}
      </div>
    </div>
  );
};
