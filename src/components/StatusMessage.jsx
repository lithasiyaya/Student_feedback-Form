import './StatusMessage.css'

export default function StatusMessage({ type, message, onDismiss }) {
  const isSuccess = type === 'success'

  return (
    <div
      className={`status-message ${isSuccess ? 'status-message--success' : 'status-message--error'}`}
      role="alert"
      aria-live="assertive"
    >
      <span className="status-icon" aria-hidden="true">
        {isSuccess ? '✅' : '❌'}
      </span>
      <p className="status-text">{message}</p>
      <button
        className="status-close"
        onClick={onDismiss}
        aria-label="Dismiss message"
        type="button"
      >
        ✕
      </button>
    </div>
  )
}
