import React from "react";
import { AlertTriangle, XCircle, CheckCircle } from "lucide-react";

interface ErrorDisplayProps {
  title: string;
  message: string;
  type: "error" | "warning" | "success" | "info";
  details?: string;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function ErrorDisplay({
  title,
  message,
  type,
  details,
  onDismiss,
  action,
}: ErrorDisplayProps) {
  const iconMap = {
    error: <XCircle className="text-destructive" size={20} />,
    warning: <AlertTriangle className="text-amber-500" size={20} />,
    success: <CheckCircle className="text-emerald-500" size={20} />,
    info: <AlertTriangle className="text-blue-500" size={20} />,
  };

  const bgMap = {
    error: "bg-red-50 border-red-200",
    warning: "bg-amber-50 border-amber-200",
    success: "bg-emerald-50 border-emerald-200",
    info: "bg-blue-50 border-blue-200",
  };

  return (
    <div className={`border rounded-lg p-6 ${bgMap[type]} space-y-4`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">{iconMap[type]}</div>
        <div className="flex-1">
          <h3 className="font-semibold text-charcoal">{title}</h3>
          <p className="text-muted-foreground text-sm mt-1">{message}</p>
          {details && (
            <details className="mt-3 text-xs">
              <summary className="cursor-pointer font-mono text-muted-foreground">
                More details
              </summary>
              <pre className="mt-2 bg-black/5 p-3 rounded text-left overflow-auto">
                {details}
              </pre>
            </details>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-muted-foreground hover:text-charcoal"
          >
            ×
          </button>
        )}
      </div>
      {action && (
        <div className="flex gap-3 pt-2">
          <button
            onClick={action.onClick}
            className="px-4 py-2 bg-charcoal text-white text-sm rounded hover:bg-charcoal/90"
          >
            {action.label}
          </button>
        </div>
      )}
    </div>
  );
}
