import React from 'react'

interface HeaderProps {
  onOpenUpdateSheet: () => void
}

export const Header: React.FC<HeaderProps> = ({ onOpenUpdateSheet }) => {
  return (
    <header className="app-header" role="banner">
      <div className="brand-group">
        <div className="brand-mark-icon" aria-hidden="true">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div className="brand-text">
          <h1 className="brand-title">ATTEND</h1>
          <span className="brand-subtitle">Attendance Companion</span>
        </div>
      </div>

      <div className="header-actions">
        <button
          type="button"
          className="header-action-button"
          onClick={onOpenUpdateSheet}
          aria-label="Update attendance totals"
          id="header-update-attendance-btn"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          <span>Update Attendance</span>
        </button>
      </div>
    </header>
  )
}
