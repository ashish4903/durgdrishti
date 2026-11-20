/** Announces short confirmations ("Link copied") visually and to screen readers. */
export default function Toast({ message }) {
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {message && <div className="toast">{message}</div>}
    </div>
  );
}
