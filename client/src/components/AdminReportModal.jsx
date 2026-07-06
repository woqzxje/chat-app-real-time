import React, { useState, useEffect, useContext } from 'react';
import { X, User, Clock, AlertTriangle, ShieldAlert, Check } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';
import { AuthContext } from '../../context/AuthContext';

export const AdminReportModal = ({ open, onOpenChange }) => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [banDurationDays, setBanDurationDays] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const { authUser, socket } = useContext(AuthContext);

  useEffect(() => {
    if (open && authUser?.email === 'quynh0369505599@gmail.com') {
      fetchReports();
    }
  }, [open, authUser]);

  useEffect(() => {
    if (!socket || authUser?.email !== 'quynh0369505599@gmail.com') return;

    const handleNewReport = (report) => {
      setReports(prev => [report, ...prev]);
      if (open) {
        fetchReports(); // Refresh to get names
      }
    };

    socket.on('newReport', handleNewReport);
    return () => socket.off('newReport', handleNewReport);
  }, [socket, authUser, open]);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const { data } = await axios.get('/api/reports', {
        params: { email: authUser.email }
      });
      setReports(data);
    } catch (error) {
      toast.error('Lỗi khi lấy danh sách báo cáo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBan = async () => {
    if (!selectedReport) return;
    try {
      await axios.post(`/api/reports/${selectedReport.id}/ban`, {
        banDurationDays: Number(banDurationDays)
      }, {
        params: { email: authUser.email }
      });
      toast.success('Đã cấm tài khoản');
      setSelectedReport(null);
      fetchReports();
    } catch (error) {
      toast.error('Lỗi khi cấm tài khoản');
    }
  };

  const handleCancelReport = async () => {
    if (!selectedReport) return;
    try {
      await axios.post(`/api/reports/${selectedReport.id}/cancel`, null, {
        params: { email: authUser.email }
      });
      toast.success('Đã hủy báo cáo');
      setSelectedReport(null);
      fetchReports();
    } catch (error) {
      toast.error('Lỗi khi hủy báo cáo');
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1e293b] w-full max-w-2xl p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 m-4 flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="text-red-500 w-7 h-7" />
            Lịch sử Báo Cáo
          </h2>
          <button onClick={() => onOpenChange(false)} className="text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* List of reports */}
          <div className="w-1/2 border-r border-slate-200 dark:border-white/10 pr-4 overflow-y-auto">
            {isLoading ? (
              <p className="text-center text-slate-500 mt-4">Đang tải...</p>
            ) : reports.length === 0 ? (
              <p className="text-center text-slate-500 mt-4">Không có báo cáo nào.</p>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className={`p-4 rounded-xl cursor-pointer transition-colors border ${selectedReport?.id === report.id ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-500/30' : 'bg-slate-50 dark:bg-white/5 border-transparent hover:bg-slate-100 dark:hover:bg-white/10'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">{report.reporterName}</span>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                        {report.status !== 'pending' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Đã xử lý</span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 truncate">Báo cáo: {report.reportedName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Report Details */}
          <div className="w-1/2 pl-4 overflow-y-auto">
            {selectedReport ? (
              <div className="flex flex-col h-full space-y-4">
                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/10">
                  <h3 className="font-bold text-slate-800 dark:text-white mb-3">Chi tiết báo cáo</h3>
                  
                  <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                    <p><span className="font-semibold w-24 inline-block">Người gửi:</span> {selectedReport.reporterName}</p>
                    <p><span className="font-semibold w-24 inline-block">Người bị RP:</span> {selectedReport.reportedName}</p>
                    <p><span className="font-semibold w-24 inline-block">Thời gian:</span> {new Date(selectedReport.createdAt).toLocaleString()}</p>
                    
                    <div className="mt-3">
                      <span className="font-semibold block mb-1">Nội dung tin nhắn bị báo cáo:</span>
                      <div className="p-3 bg-white dark:bg-black/20 rounded border border-slate-200 dark:border-white/10 italic text-slate-600 dark:text-slate-400 max-h-24 overflow-y-auto">
                        "{selectedReport.messageText}"
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <span className="font-semibold block mb-1 text-red-600 dark:text-red-400">Lý do:</span>
                      <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded border border-red-100 dark:border-red-900/30 text-red-800 dark:text-red-300">
                        {selectedReport.reason}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedReport.status === 'pending' ? (
                  <div className="mt-auto pt-4 space-y-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Thời gian cấm chat:</label>
                      <select
                        value={banDurationDays}
                        onChange={(e) => setBanDurationDays(e.target.value)}
                        className="p-2 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#0e2230] text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                      >
                        <option value={1}>1 Ngày</option>
                        <option value={3}>3 Ngày</option>
                        <option value={7}>7 Ngày</option>
                        <option value={30}>30 Ngày</option>
                        <option value={365}>Vĩnh viễn (365 Ngày)</option>
                      </select>
                    </div>
                    
                    <div className="flex gap-3">
                      <button onClick={handleCancelReport} className="flex-1 py-2 px-4 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 font-medium transition-colors">
                        Hủy Báo Cáo
                      </button>
                      <button onClick={handleBan} className="flex-1 py-2 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors shadow-lg shadow-red-500/30">
                        Cấm Chat
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-auto pt-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-xl flex items-start gap-3">
                      <div className="mt-0.5">
                        <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <span className="font-semibold text-green-800 dark:text-green-300 block">Đã xử lý</span>
                        <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                          Quyết định: {selectedReport.decision || 'Không có quyết định'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">
                <p>Chọn một báo cáo để xem chi tiết</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
