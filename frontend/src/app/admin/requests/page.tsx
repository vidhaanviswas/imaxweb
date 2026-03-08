'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api, type UserRequest } from '@/lib/api';

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'read' | 'resolved'>('all');

  const fetchRequests = (page = 1) => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    setLoading(true);
    api.admin.requests.list(token, {
      page,
      status: filter === 'all' ? undefined : filter,
    })
      .then((res) => {
        setRequests(res.data.requests);
        setPagination(res.data.pagination);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests(pagination.page);
  }, [pagination.page, filter]);

  const handleStatusChange = async (id: string, status: string) => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    try {
      await api.admin.requests.updateStatus(token, id, status);
      setRequests((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
        User Requests
      </h1>

      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'read', 'resolved'] as const).map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className={`px-4 py-2 rounded-lg transition capitalize ${filter === f ? 'bg-neon-cyan/20 text-neon-cyan' : 'glass'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div
              key={r.id}
              className={`p-6 rounded-xl glass border ${r.status === 'pending' ? 'border-neon-cyan/30' : 'border-white/10'}`}
            >
              <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                <div>
                  <span className="font-medium">{r.name}</span>
                  <span className="text-muted-foreground text-sm ml-2">({r.email})</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded capitalize ${r.status === 'pending' ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-white/10'}`}>
                  {r.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground capitalize mb-1">Type: {r.type.replace('_', ' ')}</p>
              <h3 className="font-medium mb-2">{r.subject}</h3>
              <p className="text-muted-foreground text-sm whitespace-pre-wrap mb-4">{r.message}</p>
              <p className="text-xs text-muted-foreground mb-3">
                {new Date(r.createdAt).toLocaleString()}
              </p>
              <div className="flex gap-2">
                {r.status !== 'read' && (
                  <button
                    onClick={() => handleStatusChange(r.id, 'read')}
                    className="text-sm px-3 py-1 rounded bg-white/10 hover:bg-white/20 transition"
                  >
                    Mark read
                  </button>
                )}
                {r.status !== 'resolved' && (
                  <button
                    onClick={() => handleStatusChange(r.id, 'resolved')}
                    className="text-sm px-3 py-1 rounded bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30 transition"
                  >
                    Resolve
                  </button>
                )}
                {r.status !== 'pending' && (
                  <button
                    onClick={() => handleStatusChange(r.id, 'pending')}
                    className="text-sm px-3 py-1 rounded glass hover:bg-white/10 transition"
                  >
                    Reopen
                  </button>
                )}
              </div>
            </div>
          ))}
          {requests.length === 0 && (
            <p className="text-muted-foreground text-center py-12">No requests found.</p>
          )}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
            disabled={pagination.page <= 1}
            className="px-4 py-2 rounded-lg glass disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
            disabled={pagination.page >= pagination.totalPages}
            className="px-4 py-2 rounded-lg glass disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </motion.div>
  );
}
