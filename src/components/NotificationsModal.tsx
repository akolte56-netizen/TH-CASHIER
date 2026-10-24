import React from 'react';
import { Bell, X, Check, AlertTriangle, CheckCircle2, Info, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    setPreviewReport,
    getReportById,
  } = useApp();

  if (!isOpen) return null;

  const handleNotificationClick = (notif: typeof notifications[0]) => {
    markNotificationAsRead(notif.id);
    if (notif.relatedReportId) {
      const rep = getReportById(notif.relatedReportId);
      if (rep) {
        setPreviewReport(rep);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Notifications & Alerts</h3>
              <p className="text-xs text-neutral-400">Shift submissions and approvals</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearAllNotifications}
              className="text-[11px] text-neutral-400 hover:text-white transition-colors"
            >
              Mark all read
            </button>
            <button onClick={onClose} className="text-neutral-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto space-y-2.5">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-neutral-500 text-xs">
              No new operational notifications.
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-xs ${
                  notif.read
                    ? 'bg-neutral-950/60 border-neutral-800/80 text-neutral-300'
                    : 'bg-neutral-800/60 border-amber-500/30 text-white shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    {notif.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : notif.type === 'warning' || notif.type === 'alert' ? (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : (
                      <Info className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <span className="font-semibold">{notif.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500 shrink-0">
                    {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-neutral-400 text-xs pl-6 leading-relaxed">
                  {notif.message}
                </p>

                {notif.relatedReportId && (
                  <div className="mt-2 pl-6 flex items-center gap-1 text-[11px] font-mono text-amber-400">
                    <span>Inspect {notif.relatedReportId}</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
