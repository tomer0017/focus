import { LanguageSwitcher } from "focus-client";

/**
 * Two options, both visible, each written in its own script — a radiogroup
 * rather than a select, because with exactly two choices opening something to
 * see the alternative is a step for nothing.
 *
 * It really does switch the app language on click; a static card shows one
 * state, and that state is Hebrew because Hebrew is the product default.
 */

export const Toggle = () => <LanguageSwitcher />;

export const InAHeaderStrip = () => (
  <div className="focus-header">
    <div className="focus-header__row">
      <span className="focus-brand focus-brand--inline">Focus</span>
      <LanguageSwitcher />
    </div>
  </div>
);
