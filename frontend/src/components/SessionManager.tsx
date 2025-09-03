import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Session {
  id: string;
  name: string;
  agentId: string;
  createdAt: Date;
  lastMessageAt?: Date;
}

interface SessionManagerProps {
  sessions: Session[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onCreateSession: (agentId: string, name?: string) => void;
  onRenameSession: (sessionId: string, name: string) => void;
  onDeleteSession: (sessionId: string) => void;
  agentId: string;
  agentName: string;
  darkMode: boolean;
}

const SessionManager: React.FC<SessionManagerProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onCreateSession,
  onRenameSession,
  onDeleteSession,
  agentId,
  agentName,
  darkMode
}) => {
  // 过滤出当前智能体的会话
  const agentSessions = sessions.filter(session => session.agentId === agentId);
  
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [newSessionName, setNewSessionName] = useState("");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<string | null>(null);
  const [showSessionPanel, setShowSessionPanel] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // 格式化日期显示
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // 如果小于24小时，显示"今天 HH:MM"
    if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
      return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // 如果小于48小时，显示"昨天 HH:MM"
    if (diff < 48 * 60 * 60 * 1000 && date.getDate() === now.getDate() - 1) {
      return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // 否则显示"MM-DD HH:MM"
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // 处理重命名会话
  const handleRename = (sessionId: string) => {
    if (newSessionName.trim()) {
      onRenameSession(sessionId, newSessionName.trim());
      setIsRenaming(null);
      setNewSessionName("");
    }
  };

  // 生成默认会话名称
  const getDefaultSessionName = () => {
    return `与${agentName}的对话 ${new Date().toLocaleString('zh-CN', { 
      month: 'numeric', 
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    })}`;
  };

  // 渲染会话标签
  const renderSessionTabs = () => {
    // 获取当前会话名称
    const currentSession = sessions.find(s => s.id === currentSessionId);
    const currentSessionName = currentSession 
      ? currentSession.name 
      : "选择会话";
    
    // 显示可见的标签（最多3个）
    const visibleSessions = agentSessions.slice(0, 3);
    const hasMoreSessions = agentSessions.length > 3;
    
    return (
      <div className="flex items-center overflow-x-auto hide-scrollbar">
        {agentSessions.length > 0 && (
          <div className="flex space-x-1">
            {visibleSessions.map(session => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`px-3 py-1 text-xs rounded-md whitespace-nowrap max-w-[100px] overflow-hidden text-ellipsis ${
                  session.id === currentSessionId
                    ? darkMode 
                      ? 'bg-blue-900 text-blue-200 border-blue-700' 
                      : 'bg-blue-100 text-blue-800 border-blue-200'
                    : darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="truncate">{session.name}</span>
              </button>
            ))}
            
            {/* 更多按钮 */}
            {hasMoreSessions && (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`px-2 py-1 text-xs rounded-md ${
                    darkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>···</span>
                </button>
                
                {/* 更多下拉菜单 */}
                {showDropdown && (
                  <div 
                    className={`absolute z-10 mt-1 w-48 rounded-md shadow-lg ${
                      darkMode ? 'bg-gray-800' : 'bg-white'
                    } border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
                  >
                    <div className="py-1 max-h-60 overflow-y-auto">
                      {agentSessions.slice(3).map(session => (
                        <button
                          key={session.id}
                          onClick={() => {
                            onSelectSession(session.id);
                            setShowDropdown(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-xs ${
                            darkMode 
                              ? 'text-gray-300 hover:bg-gray-700' 
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <div className="truncate">{session.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* 新建会话按钮 */}
        <button
          onClick={() => onCreateSession(agentId, getDefaultSessionName())}
          className={`ml-2 px-2 py-1 text-xs rounded-md ${
            darkMode 
              ? 'bg-blue-800 text-blue-200 hover:bg-blue-700' 
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          } flex items-center`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          <span>新建</span>
        </button>
        
        {/* 会话管理按钮 */}
        <button
          onClick={() => setShowSessionPanel(!showSessionPanel)}
          className={`ml-1 px-2 py-1 text-xs rounded-md ${
            darkMode 
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          } flex items-center`}
          title={showSessionPanel ? "收起会话管理" : "展开会话管理"}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-3 w-3 transition-transform ${showSessionPanel ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <div className={`${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
      {/* 会话标签栏 */}
      <div className={`px-3 py-1.5 flex items-center border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        {renderSessionTabs()}
      </div>
      
      {/* 展开的会话管理面板 */}
      <AnimatePresence>
        {showSessionPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className={`p-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              {agentSessions.length === 0 ? (
                <div className={`text-center py-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  暂无会话，点击"新建"开始对话
                </div>
              ) : (
                <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                  {agentSessions.map(session => (
                    <div
                      key={session.id}
                      className={`relative rounded p-1.5 ${
                        session.id === currentSessionId
                          ? darkMode 
                            ? 'bg-blue-900 border-blue-800' 
                            : 'bg-blue-50 border-blue-200'
                          : darkMode
                            ? 'bg-gray-800 hover:bg-gray-750 border-gray-700' 
                            : 'bg-white hover:bg-gray-50 border-gray-200'
                      } border cursor-pointer group flex items-center justify-between`}
                      onClick={() => isRenaming !== session.id && isConfirmingDelete !== session.id && onSelectSession(session.id)}
                    >
                      {isRenaming === session.id ? (
                        <div className="flex-1 flex items-center">
                          <input
                            type="text"
                            value={newSessionName}
                            onChange={(e) => setNewSessionName(e.target.value)}
                            placeholder="输入会话名称"
                            autoFocus
                            className={`flex-1 p-1 text-xs rounded ${
                              darkMode 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-800'
                            } border focus:outline-none focus:ring-1 focus:ring-blue-500`}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRename(session.id);
                              if (e.key === 'Escape') {
                                setIsRenaming(null);
                                setNewSessionName("");
                              }
                            }}
                            onClick={e => e.stopPropagation()}
                          />
                          <div className="flex ml-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRename(session.id);
                              }}
                              className={`p-1 rounded ${
                                darkMode ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsRenaming(null);
                                setNewSessionName("");
                              }}
                              className={`ml-1 p-1 rounded ${
                                darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ) : isConfirmingDelete === session.id ? (
                        <div className="flex-1 flex items-center justify-between">
                          <span className={`text-xs ${darkMode ? 'text-red-300' : 'text-red-600'}`}>确定删除?</span>
                          <div className="flex">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSession(session.id);
                                setIsConfirmingDelete(null);
                              }}
                              className={`p-1 rounded ${
                                darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-700'
                              }`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsConfirmingDelete(null);
                              }}
                              className={`ml-1 p-1 rounded ${
                                darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 flex items-center">
                            <div className="truncate text-xs pr-1 flex-1">{session.name}</div>
                            <div className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'} ml-1`}>
                              {session.lastMessageAt ? formatDate(session.lastMessageAt) : formatDate(session.createdAt)}
                            </div>
                          </div>
                          <div className="flex ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsRenaming(session.id);
                                setNewSessionName(session.name);
                              }}
                              className={`p-1 rounded ${
                                darkMode 
                                  ? 'hover:bg-gray-700 text-gray-300' 
                                  : 'hover:bg-gray-200 text-gray-600'
                              }`}
                              title="重命名"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsConfirmingDelete(session.id);
                              }}
                              className={`p-1 rounded ml-0.5 ${
                                darkMode 
                                  ? 'hover:bg-gray-700 text-gray-300' 
                                  : 'hover:bg-gray-200 text-gray-600'
                              }`}
                              title="删除"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                          {session.id === currentSessionId && (
                            <div className={`absolute top-0 left-0 w-1 h-full rounded-l-md ${darkMode ? 'bg-blue-500' : 'bg-blue-500'}`}></div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SessionManager; 