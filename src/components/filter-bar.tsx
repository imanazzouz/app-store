import Link from 'next/link';
import { propertyTypes, typeLabels, type PropertyType } from '@/lib/validation';

type Active = PropertyType | 'all';

type Props = {
  counts: Record<string, number>;
  active?: Active;
  availableOnly: boolean;
};

export default function FilterBar({ counts, active = 'all', availableOnly }: Props) {
  const total =
    (counts.commercial ?? 0) + (counts.residential ?? 0) + (counts.warehouse ?? 0);

  const chips: { key: Active; label: string; n: number }[] = [
    { key: 'all', label: 'الكل', n: total },
    ...propertyTypes.map((t) => ({ key: t as Active, label: typeLabels[t], n: counts[t] ?? 0 })),
  ];

  const hrefFor = (key: Active, available?: boolean) => {
    const params = new URLSearchParams();
    if (key !== 'all') params.set('type', key);
    if (available ?? availableOnly) params.set('available', '1');
    const qs = params.toString();
    return `/properties${qs ? `?${qs}` : ''}`;
  };

  return (
    <div className="filter-bar">
      <div className="filter-chips" role="group" aria-label="تصفية حسب نوع العقار">
        {chips.map((chip) => (
          <Link
            key={chip.key}
            href={hrefFor(chip.key)}
            className={`chip${active === chip.key ? ' chip-active' : ''}`}
            aria-current={active === chip.key ? 'true' : undefined}
          >
            {chip.label}
            <span className="chip-count">{chip.n}</span>
          </Link>
        ))}
      </div>

      <Link
        href={hrefFor(active, !availableOnly)}
        className={`chip chip-toggle${availableOnly ? ' chip-active' : ''}`}
        aria-pressed={availableOnly}
      >
        {availableOnly ? '✓ ' : ''}المتاحة فقط
      </Link>
    </div>
  );
}
