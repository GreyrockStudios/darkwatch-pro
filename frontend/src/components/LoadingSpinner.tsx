import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const sizeMap = { sm: '1rem', md: '2rem', lg: '3rem' };
  const s = sizeMap[size];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', gap: '1rem' }}>
      <div style={{
        width: s,
        height: s,
        border: '3px solid var(--border-color, #333)',
        borderTopColor: 'var(--accent-primary, #6f42c1)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      {text && <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{text}</span>}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ title = 'Error', message, onRetry }: ErrorMessageProps) {
  return (
    <div style={{
      background: 'rgba(255,107,107,0.1)',
      border: '1px solid rgba(255,107,107,0.3)',
      borderRadius: '8px',
      padding: '1.5rem',
      margin: '1rem 0',
    }}>
      <h3 style={{ color: '#ff6b6b', margin: '0 0 0.5rem 0' }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{message}</p>
      {onRetry && (
        <button onClick={onRetry} style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          background: 'var(--accent-primary)',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
        }}>
          Retry
        </button>
      )}
    </div>
  );
}

interface ToastContainerProps {
  toasts: Array<{ id: string; type: 'success' | 'error' | 'info' | 'warning'; message: string }>;
  removeToast: (id: string) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  const colorMap = {
    success: '#00c853',
    error: '#ff6b6b',
    info: '#00ccff',
    warning: '#ffc107',
  };

  return (
    <div style={{
      position: 'fixed',
      top: '1rem',
      right: '1rem',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      maxWidth: '400px',
    }}>
      {toasts.map((toast) => (
        <div key={toast.id} style={{
          background: 'var(--bg-secondary, #1a1a2e)',
          border: `1px solid ${colorMap[toast.type]}`,
          borderLeft: `4px solid ${colorMap[toast.type]}`,
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          animation: 'slideIn 0.3s ease',
        }}>
          <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '1.2rem',
            lineHeight: 1,
          }}>×</button>
        </div>
      ))}
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </div>
  );
}

// Skeleton loader for content areas
export function Skeleton({ width = '100%', height = '1rem', count = 1 }: { width?: string; height?: string; count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          width,
          height,
          background: 'linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-quaternary) 50%, var(--bg-tertiary) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
          borderRadius: '4px',
          marginBottom: count > 1 ? '0.5rem' : 0,
        }} />
      ))}
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
    </>
  );
}

export function PageSkeleton() {
  return (
    <div style={{ padding: '2rem' }}>
      <Skeleton width="200px" height="2rem" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
        <Skeleton height="5rem" />
        <Skeleton height="5rem" />
        <Skeleton height="5rem" />
        <Skeleton height="5rem" />
      </div>
      <Skeleton width="100%" height="15rem" count={2} />
    </div>
  );
}