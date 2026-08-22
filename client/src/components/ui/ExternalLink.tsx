import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "./Icon";
import { isExternalUrl } from "../../lib/links";

interface ExternalLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  /** Set when the whole surrounding card is the click target. */
  stretched?: boolean;
}

/**
 * The only way the app sends someone to another site.
 *
 * It refuses anything that is not a real `http(s)` destination — `#`, a
 * relative path, a placeholder host — so a broken link can never be rendered as
 * a working one. Every external destination opens in a new tab, is marked with
 * an icon, and says so to a screen reader; `noopener noreferrer` is not
 * optional.
 */
export function ExternalLink({ href, children, className, stretched }: ExternalLinkProps) {
  const { t } = useTranslation();

  if (!isExternalUrl(href)) return <span className={className}>{children}</span>;

  return (
    <a
      href={href}
      className={`${stretched ? "stretched-link " : ""}focus-external${className ? " " + className : ""}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <Icon name="external" size={13} className="focus-external__icon" />
      <span className="visually-hidden">{t("actions.opensInNewTab")}</span>
    </a>
  );
}
