interface Stat {
  /** Interface copy. */
  label: string;
  /** Already formatted through `lib/format.ts`. */
  value: string;
  /** Softens a figure that is context rather than headline. */
  muted?: boolean;
}

/**
 * Two to four numbers on one line.
 *
 * Explicitly not a KPI strip: it is used once on the money view (in, out,
 * balance, unpaid) and once on a menu (dishes, guests), and each number answers
 * a question somebody actually asked. There is no sparkline, no delta against
 * last month and no colour-coded arrow, because none of those change what
 * anybody does next.
 */
export function StatRow({ stats }: { stats: Stat[] }) {
  return (
    <dl className="focus-stats mb-0">
      {stats.map((stat) => (
        <div key={stat.label} className="focus-stat">
          <dt className="focus-stat__label">{stat.label}</dt>
          <dd className={`focus-stat__value${stat.muted ? " text-secondary" : ""} mb-0`}>
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
