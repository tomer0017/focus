import { Component, type ErrorInfo, type ReactNode } from "react";
import { withTranslation, type WithTranslation } from "react-i18next";
import { ErrorState } from "./ui/ErrorState";

interface Props extends WithTranslation {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Top-level error boundary. Catches render/lifecycle crashes so a single broken
 * component cannot blank the whole app.
 *
 * Error boundaries have no hook equivalent, so this stays a class component and
 * receives `t` through the HOC rather than a hook.
 */
class ErrorBoundaryBase extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Central place to forward to a reporting service later.
    console.error("Unhandled UI error", error, info.componentStack);
  }

  private handleReload = (): void => {
    /*
     * `import.meta.env.BASE_URL`, not "/": the built app is served from a
     * sub-path on GitHub Pages ("/focus/"), and a bare "/" would leave the
     * app entirely. In development BASE_URL is "/", so this is unchanged.
     */
    window.location.assign(import.meta.env.BASE_URL);
  };

  render(): ReactNode {
    const { error } = this.state;
    const { t, children } = this.props;

    if (!error) return children;

    return (
      <main className="container py-5" style={{ maxWidth: "40rem" }}>
        <h1 className="h4 mb-3">{t("errors.boundaryHeading")}</h1>
        <ErrorState
          title={t("errors.boundaryTitle")}
          message={t("errors.boundaryMessage")}
          onRetry={this.handleReload}
        />
      </main>
    );
  }
}

export const AppErrorBoundary = withTranslation()(ErrorBoundaryBase);
