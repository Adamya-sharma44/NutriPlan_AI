/**
 * Small shared building blocks used across the app.
 * Each one is a plain semantic element so the page stays accessible.
 */

/** A dismissible message box. `role="status"` announces it to screen readers. */
export function Alert({ type = 'info', title, children, onDismiss }) {
  if (!children && !title) return null;

  return (
    <div className={`alert alert--${type}`} role="status" aria-live="polite">
      <div className="alert__body">
        {title && <p className="alert__title">{title}</p>}
        {children && <div className="alert__text">{children}</div>}
      </div>
      {onDismiss && (
        <button type="button" className="alert__close" onClick={onDismiss} aria-label="Dismiss message">
          &times;
        </button>
      )}
    </div>
  );
}

/** Inline, field-level error text tied to its input via aria-describedby. */
export function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p className="field__error" id={id} role="alert">
      {message}
    </p>
  );
}

/** Full-page loading state used while data is fetched. */
export function Loading({ label = 'Loading…' }) {
  return (
    <div className="loading" role="status" aria-live="polite">
      <span className="loading__spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

/** Empty-state card, used when a list has nothing in it yet. */
export function EmptyState({ title, children, action }) {
  return (
    <div className="empty-state">
      <h3 className="empty-state__title">{title}</h3>
      {children && <p className="empty-state__text">{children}</p>}
      {action}
    </div>
  );
}

/** Banner explaining whether the app is using the real AI or the demo planner. */
export function DemoBanner({ aiStatus }) {
  if (!aiStatus || aiStatus.mode !== 'demo') return null;

  return (
    <div className="demo-banner" role="note">
      <strong>Demo mode.</strong> {aiStatus.reason}{' '}
      Add an <code>AI_API_KEY</code> to <code>backend/.env</code> to use the live AI service. The
      planning workflow below works exactly the same either way.
    </div>
  );
}
