import React from 'react';

export default function SortTabs({ sort, set, summary, hasRatings }) {
  const tabs = [
    { id: 'rate', label: 'Best Rate', ...summary.rate },
    ...(hasRatings ? [{ id: 'rating', label: 'Highest Rated', ...summary.rating }] : []),
    { id: 'near', label: 'Closest / Most Branches', ...summary.near },
  ];
  return (
    <div role="tablist" aria-label="Sort results" className={`panel grid grid-cols-1 gap-2 p-2 ${tabs.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
      {tabs.map((t) => (
        <button
          key={t.id} role="tab" type="button" aria-selected={sort === t.id} onClick={() => set({ sort: t.id })}
          className="key flex-col !items-start gap-0.5 !rounded-xl px-4 py-2.5 text-left"
        >
          <span className="font-display text-lg font-bold uppercase leading-none tracking-wide">{t.label}</span>
          <span className="text-sm font-medium opacity-90">{t.value}</span>
          <span className="truncate text-xs opacity-75">{t.sub}</span>
        </button>
      ))}
    </div>
  );
}
