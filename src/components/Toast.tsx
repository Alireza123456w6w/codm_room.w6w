import React from 'react';

export interface ToastMessage {
  id: string;
  msg: string;
  type: 'info' | 'ok' | 'err' | 'warn';
}

interface ToastProps {
  toasts: ToastMessage[];
}

export const Toast: React.FC<ToastProps> = ({ toasts }) => {
  return (
    <div id="toastRoot">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.msg}
        </div>
      ))}
    </div>
  );
};
