import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "../../components/ui/Icon";

interface ActivityInsightProps {
  sessions: number;
}

/**
 * One number, and only one.
 *
 * "Sessions this month" answers a question somebody actually asks themselves.
 * A row of counters — pages, links, tasks, streaks — answers none of them, so
 * the overview carries exactly this and nothing else.
 */
export function ActivityInsight({ sessions }: ActivityInsightProps) {
  const { t } = useTranslation(["dashboard"]);

  if (sessions === 0) return null;

  return (
    <section className="focus-insight focus-section--full">
      <span className="focus-insight__icon" aria-hidden="true">
        <Icon name="training" size={18} />
      </span>
      <p className="focus-insight__text mb-0">
        {t("dashboard:insight.sessionsThisMonth", { count: sessions })}
      </p>
      <Link to="/training" className="focus-section-action">
        {t("dashboard:insight.openTraining")}
      </Link>
    </section>
  );
}
