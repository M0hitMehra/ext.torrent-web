/**
 * Toast.jsx
 * Floating glassmorphic notification toast.
 */
import React from 'react';
import { Check, Copy } from 'lucide-react';

export function Toast({ message, visible }) {
  if (!visible) return null;

  return (
    <div className="toast-floating-container animate-fade-in">
      <div className="toast-box glass-panel">
        <div className="toast-icon-circle">
          <Check size={16} color="#ffffff" />
        </div>
        <span className="toast-message-text">{message}</span>
      </div>
    </div>
  );
}

export default Toast;
