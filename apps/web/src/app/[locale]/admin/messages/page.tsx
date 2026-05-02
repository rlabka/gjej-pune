'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import {
  getAdminMessages,
  getAdminConversations,
  deleteMessage,
  permanentlyDeleteMessage,
  blockMessage,
  unblockMessage,
  archiveMessage,
  unarchiveMessage,
  deleteConversation,
  permanentlyDeleteConversation,
  blockConversation,
  unblockConversation,
  archiveConversation,
  unarchiveConversation,
  type AdminMessage,
  type MessageConversation,
  type MessageStatus,
  type MessageSenderType
} from '@/data/mockAdminMessages';
import { Search, Trash2, Ban, Archive, Eye, MoreVertical, MessageSquare, User, Building2, AlertTriangle, X } from 'lucide-react';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

type ViewMode = 'messages' | 'conversations';

export default function AdminMessagesPage() {
  const t = useTranslations('Admin.messagesPage');
  const tCommon = useTranslations('Admin');
  
  const [viewMode, setViewMode] = useState<ViewMode>('messages');
  const [statusFilter, setStatusFilter] = useState<MessageStatus | 'all'>('all');
  const [senderTypeFilter, setSenderTypeFilter] = useState<MessageSenderType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<AdminMessage | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<MessageConversation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'message' | 'conversation'; id: string; name: string } | null>(null);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<{ type: 'message' | 'conversation'; id: string; name: string } | null>(null);
  const [blockTarget, setBlockTarget] = useState<{ type: 'message' | 'conversation'; id: string; name: string } | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<{ type: 'message' | 'conversation'; id: string; name: string } | null>(null);

  const [messages, setMessages] = useState<AdminMessage[]>(() => getAdminMessages());
  const [conversations, setConversations] = useState<MessageConversation[]>(() => getAdminConversations());

  const refreshMessages = useCallback(() => setMessages(getAdminMessages()), []);
  const refreshConversations = useCallback(() => setConversations(getAdminConversations()), []);

  const filteredMessages = useMemo(() => {
    let result = messages;
    
    if (statusFilter !== 'all') {
      result = result.filter((m) => m.status === statusFilter);
    }
    
    if (senderTypeFilter !== 'all') {
      result = result.filter((m) => m.senderType === senderTypeFilter);
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((m) =>
        m.content.toLowerCase().includes(q) ||
        m.senderName.toLowerCase().includes(q) ||
        m.senderEmail.toLowerCase().includes(q) ||
        m.recipientName.toLowerCase().includes(q) ||
        m.recipientEmail.toLowerCase().includes(q)
      );
    }
    
    return result;
  }, [messages, statusFilter, senderTypeFilter, searchQuery]);

  const filteredConversations = useMemo(() => {
    let result = conversations;
    
    if (statusFilter !== 'all') {
      result = result.filter((c) => c.status === statusFilter);
    }
    
    if (senderTypeFilter !== 'all') {
      result = result.filter((c) => 
        c.participant1Type === senderTypeFilter || 
        c.participant2Type === senderTypeFilter
      );
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) =>
        c.participant1Name.toLowerCase().includes(q) ||
        c.participant1Email.toLowerCase().includes(q) ||
        c.participant2Name.toLowerCase().includes(q) ||
        c.participant2Email.toLowerCase().includes(q)
      );
    }
    
    return result;
  }, [conversations, statusFilter, senderTypeFilter, searchQuery]);

  const handleDeleteMessage = useCallback((id: string) => {
    deleteMessage(id);
    refreshMessages();
    setDeleteTarget(null);
  }, [refreshMessages]);

  const handlePermanentDeleteMessage = useCallback((id: string) => {
    permanentlyDeleteMessage(id);
    refreshMessages();
    setPermanentDeleteTarget(null);
  }, [refreshMessages]);

  const handleBlockMessage = useCallback((id: string) => {
    blockMessage(id);
    refreshMessages();
    setBlockTarget(null);
  }, [refreshMessages]);

  const handleUnblockMessage = useCallback((id: string) => {
    unblockMessage(id);
    refreshMessages();
  }, [refreshMessages]);

  const handleArchiveMessage = useCallback((id: string) => {
    archiveMessage(id);
    refreshMessages();
    setArchiveTarget(null);
  }, [refreshMessages]);

  const handleUnarchiveMessage = useCallback((id: string) => {
    unarchiveMessage(id);
    refreshMessages();
  }, [refreshMessages]);

  const handleDeleteConversation = useCallback((id: string) => {
    deleteConversation(id);
    refreshConversations();
    refreshMessages();
    setDeleteTarget(null);
  }, [refreshConversations, refreshMessages]);

  const handlePermanentDeleteConversation = useCallback((id: string) => {
    permanentlyDeleteConversation(id);
    refreshConversations();
    refreshMessages();
    setPermanentDeleteTarget(null);
  }, [refreshConversations, refreshMessages]);

  const handleBlockConversation = useCallback((id: string) => {
    blockConversation(id);
    refreshConversations();
    refreshMessages();
    setBlockTarget(null);
  }, [refreshConversations, refreshMessages]);

  const handleUnblockConversation = useCallback((id: string) => {
    unblockConversation(id);
    refreshConversations();
    refreshMessages();
  }, [refreshConversations, refreshMessages]);

  const handleArchiveConversation = useCallback((id: string) => {
    archiveConversation(id);
    refreshConversations();
    refreshMessages();
    setArchiveTarget(null);
  }, [refreshConversations, refreshMessages]);

  const handleUnarchiveConversation = useCallback((id: string) => {
    unarchiveConversation(id);
    refreshConversations();
    refreshMessages();
  }, [refreshConversations, refreshMessages]);

  const getStatusBadgeVariant = (status: MessageStatus): 'default' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'active': return 'success';
      case 'blocked': return 'error';
      case 'archived': return 'warning';
      case 'deleted': return 'default';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#162C66]">{t('title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('subtitle')}</p>
      </div>

      {/* View Mode Toggle */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-slate-600">{t('viewMode')}:</span>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'messages' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('messages')}
            >
              <MessageSquare size={16} />
              <span>{t('messages')}</span>
            </Button>
            <Button
              variant={viewMode === 'conversations' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('conversations')}
            >
              <User size={16} />
              <span>{t('conversations')}</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} aria-hidden />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-300 outline-none"
              aria-label={t('searchPlaceholder')}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-600 whitespace-nowrap">{t('filterStatus')}:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as MessageStatus | 'all')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white focus:ring-2 focus:ring-slate-300 outline-none"
              aria-label={t('filterStatus')}
            >
              <option value="all">{t('statusAll')}</option>
              <option value="active">{t('statusActive')}</option>
              <option value="blocked">{t('statusBlocked')}</option>
              <option value="archived">{t('statusArchived')}</option>
              <option value="deleted">{t('statusDeleted')}</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-600 whitespace-nowrap">{t('filterSenderType')}:</span>
            <select
              value={senderTypeFilter}
              onChange={(e) => setSenderTypeFilter(e.target.value as MessageSenderType | 'all')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white focus:ring-2 focus:ring-slate-300 outline-none"
              aria-label={t('filterSenderType')}
            >
              <option value="all">{t('senderTypeAll')}</option>
              <option value="job-seeker">{tCommon('role.jobSeeker')}</option>
              <option value="employer">{tCommon('role.employer')}</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Messages View */}
      {viewMode === 'messages' && (
        <Card className="p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-[#162C66]">{t('messages')} ({filteredMessages.length})</h2>
          </div>
          {filteredMessages.length === 0 ? (
            <p className="px-6 py-12 text-sm text-slate-500 text-center">{t('emptyMessages')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('sender')}</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('recipient')}</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('content')}</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('sentAt')}</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('status')}</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-40">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMessages.map((msg) => (
                    <tr key={msg.id} className="border-b border-slate-50 hover:bg-slate-50/30">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          {msg.senderType === 'job-seeker' ? (
                            <User size={16} className="text-slate-400" />
                          ) : (
                            <Building2 size={16} className="text-slate-400" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-slate-800">{msg.senderName}</p>
                            <p className="text-xs text-slate-500">{msg.senderEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          {msg.recipientType === 'job-seeker' ? (
                            <User size={16} className="text-slate-400" />
                          ) : (
                            <Building2 size={16} className="text-slate-400" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-slate-800">{msg.recipientName}</p>
                            <p className="text-xs text-slate-500">{msg.recipientEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <p className="text-sm text-slate-600 max-w-md truncate">{msg.content}</p>
                        {msg.isReported && (
                          <div className="flex items-center gap-1 mt-1">
                            <AlertTriangle size={12} className="text-red-500" />
                            <span className="text-xs text-red-600 font-medium">{t('reported')}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-600">{formatDate(msg.sentAt)}</td>
                      <td className="px-6 py-3">
                        <Badge variant={getStatusBadgeVariant(msg.status)}>
                          {t(`status${msg.status.charAt(0).toUpperCase() + msg.status.slice(1)}`)}
                        </Badge>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedMessage(msg)}
                            className="!p-2"
                            title={t('view')}
                          >
                            <Eye size={16} />
                          </Button>
                          {msg.status === 'blocked' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnblockMessage(msg.id)}
                              className="!p-2 text-green-600"
                              title={t('unblock')}
                            >
                              <Ban size={16} />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setBlockTarget({ type: 'message', id: msg.id, name: msg.content.substring(0, 30) })}
                              className="!p-2 text-amber-600"
                              title={t('block')}
                            >
                              <Ban size={16} />
                            </Button>
                          )}
                          {msg.status === 'archived' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnarchiveMessage(msg.id)}
                              className="!p-2 text-green-600"
                              title={t('unarchive')}
                            >
                              <Archive size={16} />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setArchiveTarget({ type: 'message', id: msg.id, name: msg.content.substring(0, 30) })}
                              className="!p-2 text-blue-600"
                              title={t('archive')}
                            >
                              <Archive size={16} />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget({ type: 'message', id: msg.id, name: msg.content.substring(0, 30) })}
                            className="!p-2 text-red-600"
                            title={t('delete')}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Conversations View */}
      {viewMode === 'conversations' && (
        <Card className="p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-[#162C66]">{t('conversations')} ({filteredConversations.length})</h2>
          </div>
          {filteredConversations.length === 0 ? (
            <p className="px-6 py-12 text-sm text-slate-500 text-center">{t('emptyConversations')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('participant1')}</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('participant2')}</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('messageCount')}</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('lastMessageAt')}</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('status')}</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-40">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredConversations.map((conv) => (
                    <tr key={conv.id} className="border-b border-slate-50 hover:bg-slate-50/30">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          {conv.participant1Type === 'job-seeker' ? (
                            <User size={16} className="text-slate-400" />
                          ) : (
                            <Building2 size={16} className="text-slate-400" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-slate-800">{conv.participant1Name}</p>
                            <p className="text-xs text-slate-500">{conv.participant1Email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          {conv.participant2Type === 'job-seeker' ? (
                            <User size={16} className="text-slate-400" />
                          ) : (
                            <Building2 size={16} className="text-slate-400" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-slate-800">{conv.participant2Name}</p>
                            <p className="text-xs text-slate-500">{conv.participant2Email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-600">{conv.messageCount}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">{formatDateShort(conv.lastMessageAt)}</td>
                      <td className="px-6 py-3">
                        <Badge variant={getStatusBadgeVariant(conv.status)}>
                          {t(`status${conv.status.charAt(0).toUpperCase() + conv.status.slice(1)}`)}
                        </Badge>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          {conv.status === 'blocked' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnblockConversation(conv.id)}
                              className="!p-2 text-green-600"
                              title={t('unblock')}
                            >
                              <Ban size={16} />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setBlockTarget({ type: 'conversation', id: conv.id, name: `${conv.participant1Name} ↔ ${conv.participant2Name}` })}
                              className="!p-2 text-amber-600"
                              title={t('block')}
                            >
                              <Ban size={16} />
                            </Button>
                          )}
                          {conv.status === 'archived' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnarchiveConversation(conv.id)}
                              className="!p-2 text-green-600"
                              title={t('unarchive')}
                            >
                              <Archive size={16} />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setArchiveTarget({ type: 'conversation', id: conv.id, name: `${conv.participant1Name} ↔ ${conv.participant2Name}` })}
                              className="!p-2 text-blue-600"
                              title={t('archive')}
                            >
                              <Archive size={16} />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget({ type: 'conversation', id: conv.id, name: `${conv.participant1Name} ↔ ${conv.participant2Name}` })}
                            className="!p-2 text-red-600"
                            title={t('delete')}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Message Detail Modal */}
      <Modal
        open={!!selectedMessage}
        onClose={() => setSelectedMessage(null)}
        title={t('messageDetails')}
        size="lg"
      >
        {selectedMessage && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">{t('sender')}</p>
                <p className="text-sm font-medium text-slate-800">{selectedMessage.senderName}</p>
                <p className="text-xs text-slate-500">{selectedMessage.senderEmail}</p>
                <Badge variant="default" className="mt-1">
                  {selectedMessage.senderType === 'job-seeker' ? tCommon('role.jobSeeker') : tCommon('role.employer')}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">{t('recipient')}</p>
                <p className="text-sm font-medium text-slate-800">{selectedMessage.recipientName}</p>
                <p className="text-xs text-slate-500">{selectedMessage.recipientEmail}</p>
                <Badge variant="default" className="mt-1">
                  {selectedMessage.recipientType === 'job-seeker' ? tCommon('role.jobSeeker') : tCommon('role.employer')}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">{t('content')}</p>
              <p className="text-sm text-slate-800 bg-slate-50 p-4 rounded-xl">{selectedMessage.content}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">{t('sentAt')}</p>
                <p className="text-sm text-slate-600">{formatDate(selectedMessage.sentAt)}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">{t('status')}</p>
                <Badge variant={getStatusBadgeVariant(selectedMessage.status)}>
                  {t(`status${selectedMessage.status.charAt(0).toUpperCase() + selectedMessage.status.slice(1)}`)}
                </Badge>
              </div>
            </div>
            {selectedMessage.isReported && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-red-600" />
                  <p className="text-sm font-bold text-red-800">{t('reported')}</p>
                </div>
                {selectedMessage.reportReason && (
                  <p className="text-sm text-red-700">{t('reportReason')}: {selectedMessage.reportReason}</p>
                )}
                {selectedMessage.reportedAt && (
                  <p className="text-xs text-red-600 mt-1">{t('reportedAt')}: {formatDate(selectedMessage.reportedAt)}</p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t('confirmDeleteTitle')}
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>{t('cancel')}</Button>
            <Button
              variant="secondary"
              size="sm"
              className="!bg-red-600 !text-white hover:!bg-red-700"
              onClick={() => {
                if (deleteTarget) {
                  if (deleteTarget.type === 'message') {
                    handleDeleteMessage(deleteTarget.id);
                  } else {
                    handleDeleteConversation(deleteTarget.id);
                  }
                }
              }}
            >
              {t('delete')}
            </Button>
          </>
        }
      >
        {deleteTarget && (
          <p className="text-sm text-slate-600">{t('confirmDeleteMessage')}</p>
        )}
      </Modal>

      {/* Permanent Delete Confirmation Modal */}
      <Modal
        open={!!permanentDeleteTarget}
        onClose={() => setPermanentDeleteTarget(null)}
        title={t('confirmPermanentDeleteTitle')}
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setPermanentDeleteTarget(null)}>{t('cancel')}</Button>
            <Button
              variant="secondary"
              size="sm"
              className="!bg-red-600 !text-white hover:!bg-red-700"
              onClick={() => {
                if (permanentDeleteTarget) {
                  if (permanentDeleteTarget.type === 'message') {
                    handlePermanentDeleteMessage(permanentDeleteTarget.id);
                  } else {
                    handlePermanentDeleteConversation(permanentDeleteTarget.id);
                  }
                }
              }}
            >
              {t('permanentDelete')}
            </Button>
          </>
        }
      >
        {permanentDeleteTarget && (
          <p className="text-sm text-slate-600">{t('confirmPermanentDeleteMessage')}</p>
        )}
      </Modal>

      {/* Block Confirmation Modal */}
      <Modal
        open={!!blockTarget}
        onClose={() => setBlockTarget(null)}
        title={t('confirmBlockTitle')}
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setBlockTarget(null)}>{t('cancel')}</Button>
            <Button
              variant="secondary"
              size="sm"
              className="!bg-amber-600 !text-white hover:!bg-amber-700"
              onClick={() => {
                if (blockTarget) {
                  if (blockTarget.type === 'message') {
                    handleBlockMessage(blockTarget.id);
                  } else {
                    handleBlockConversation(blockTarget.id);
                  }
                }
              }}
            >
              {t('block')}
            </Button>
          </>
        }
      >
        {blockTarget && (
          <p className="text-sm text-slate-600">{t('confirmBlockMessage')}</p>
        )}
      </Modal>

      {/* Archive Confirmation Modal */}
      <Modal
        open={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        title={t('confirmArchiveTitle')}
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setArchiveTarget(null)}>{t('cancel')}</Button>
            <Button
              variant="secondary"
              size="sm"
              className="!bg-blue-600 !text-white hover:!bg-blue-700"
              onClick={() => {
                if (archiveTarget) {
                  if (archiveTarget.type === 'message') {
                    handleArchiveMessage(archiveTarget.id);
                  } else {
                    handleArchiveConversation(archiveTarget.id);
                  }
                }
              }}
            >
              {t('archive')}
            </Button>
          </>
        }
      >
        {archiveTarget && (
          <p className="text-sm text-slate-600">{t('confirmArchiveMessage')}</p>
        )}
      </Modal>
    </div>
  );
}
