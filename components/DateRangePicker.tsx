"use client";
import { useId } from "react";

export default function DateRangePicker({
  from, to, onChange, disabled = false,
}: {
  from: string;
  to: string;
  onChange: (next: { from: string; to: string }) => void;
  disabled?: boolean;
}) {
  const idFrom = useId();
  const idTo = useId();

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor={idFrom} className="text-xs text-gray-600">De</label>
        <input
          id={idFrom}
          type="date"
          value={from}
          onChange={(e) => onChange({ from: e.target.value, to })}
          className="mt-1 w-40 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50"
          disabled={disabled}
        />
      </div>
      <div>
        <label htmlFor={idTo} className="text-xs text-gray-600">Até</label>
        <input
          id={idTo}
          type="date"
          value={to}
          onChange={(e) => onChange({ from, to: e.target.value })}
          className="mt-1 w-40 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
