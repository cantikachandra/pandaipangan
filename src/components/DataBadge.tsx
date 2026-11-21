import React from 'react';
import type { StatusData } from '../types/pangan';

interface DataBadgeProps {
  status: StatusData;
  sumber?: string;
  compact?: boolean;
}

export const DataBadge: React.FC<DataBadgeProps> = ({ status, sumber, compact = false }) => {
  if (status === 'NYATA') {
    return (
      <span
        title={sumber ? `Data Nyata — Sumber: ${sumber}` : 'Data Nyata'}
        className="inline-flex items-center gap-1.5 rounded border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 font-mono text-[11px] font-medium text-emerald-800 whitespace-nowrap shrink-0"
      >
        <span className="font-semibold">NYATA</span>
        {!compact && sumber && (
          <>
            <span aria-hidden="true" className="text-emerald-400">
              ·
            </span>
            <span className="max-w-[200px] truncate font-sans text-[11px] font-normal text-emerald-700">
              {sumber}
            </span>
          </>
        )}
      </span>
    );
  }

  return (
    <span
      title={sumber ? `Data Simulasi — ${sumber}` : 'Data Simulasi'}
      className="inline-flex items-center gap-1.5 rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 font-mono text-[11px] font-medium text-amber-800 whitespace-nowrap shrink-0"
    >
      <span className="font-semibold">SIMULASI</span>
      {!compact && sumber && (
        <>
          <span aria-hidden="true" className="text-amber-400">
            ·
          </span>
          <span className="max-w-[200px] truncate font-sans text-[11px] font-normal text-amber-700">
            {sumber}
          </span>
        </>
      )}
    </span>
  );
};
