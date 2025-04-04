import React, { useState, useEffect } from 'react';
import ChatWindow from './components/ChatWindow';
import { motion } from 'framer-motion';
import SessionManager, { Session } from './components/SessionManager';
import { v4 as uuidv4 } from 'uuid';

interface Agent {
    id: string;
    name: string;
    description: string;
    category: string;
}

interface Message {
    content: string;
    from: string;
    timestamp: Date;
    isFinal?: boolean; // 标记消息是否是最终消息
}

// 会话消息历史记录
interface SessionMessages {
    [sessionId: string]: Message[];
}

// 按分类组织智能体
interface AgentGroup {
    [category: string]: Agent[];
}

// 保存会话到 localStorage
const saveSessionsToLocalStorage = (sessions: Session[]) => {
    try {
        // 将Date对象转换为ISO字符串以便存储
        const serializedSessions = JSON.stringify(sessions, (key, value) => {
            if ((key === 'createdAt' || key === 'lastMessageAt') && value instanceof Date) {
                return value.toISOString();
            }
            return value;
        });
        localStorage.setItem('sessions', serializedSessions);
    } catch (error) {
        console.error('保存会话失败:', error);
    }
};

// 从 localStorage 读取会话
const loadSessionsFromLocalStorage = (): Session[] => {
    try {
        const serializedSessions = localStorage.getItem('sessions');
        if (serializedSessions) {
            // 将ISO字符串转换回Date对象
            return JSON.parse(serializedSessions, (key, value) => {
                if ((key === 'createdAt' || key === 'lastMessageAt') && typeof value === 'string') {
                    return new Date(value);
                }
                return value;
            });
        }
    } catch (error) {
        console.error('读取会话失败:', error);
    }
    return [];
};

// 保存消息历史到 localStorage
const saveMessagesToLocalStorage = (messages: SessionMessages) => {
    try {
        // 将Date对象转换为ISO字符串以便存储
        const serializedMessages = JSON.stringify(messages, (key, value) => {
            if (key === 'timestamp' && value instanceof Date) {
                return value.toISOString();
            }
            return value;
        });
        localStorage.setItem('sessionMessages', serializedMessages);
    } catch (error) {
        console.error('保存消息历史记录失败:', error);
    }
};

// 从 localStorage 读取消息历史
const loadMessagesFromLocalStorage = (): SessionMessages => {
    try {
        const serializedMessages = localStorage.getItem('sessionMessages');
        if (serializedMessages) {
            // 将ISO字符串转换回Date对象
            return JSON.parse(serializedMessages, (key, value) => {
                if (key === 'timestamp' && typeof value === 'string') {
                    return new Date(value);
                }
                return value;
            });
        }
    } catch (error) {
        console.error('读取消息历史记录失败:', error);
    }
    return {};
};

const App: React.FC = () => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [sessions, setSessions] = useState<Session[]>(loadSessionsFromLocalStorage());
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [sessionMessages, setSessionMessages] = useState<SessionMessages>(loadMessagesFromLocalStorage());
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [clearModalOpen, setClearModalOpen] = useState(false);
    const [viewState, setViewState] = useState<'agents' | 'sessions'>('agents');
    const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [tempSessionName, setTempSessionName] = useState<string>('');

    // 将智能体按分类分组
    const groupedAgents = agents.reduce((acc: AgentGroup, agent) => {
        const category = agent.category || '未分类';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(agent);
        return acc;
    }, {});

    // 保存会话到localStorage
    useEffect(() => {
        saveSessionsToLocalStorage(sessions);
    }, [sessions]);

    // 保存消息历史到localStorage
    useEffect(() => {
        saveMessagesToLocalStorage(sessionMessages);
    }, [sessionMessages]);

    // 保存深色模式设置
    useEffect(() => {
        localStorage.setItem('darkMode', darkMode.toString());
    }, [darkMode]);

    useEffect(() => {
        let websocket: WebSocket | null = null;
        
        // 建立WebSocket连接函数
        const connectWebSocket = () => {
            console.log('尝试建立WebSocket连接...');
            websocket = new WebSocket('ws://localhost:8000/ws/client1');
            
            websocket.onopen = () => {
                console.log('WebSocket连接已建立, 当前会话ID:', currentSessionId);
                setWs(websocket);
            };

            websocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('收到WebSocket消息:', data);
                    
                    // 确保有currentSessionId才处理消息
                    if (!currentSessionId) {
                        console.error('缺少currentSessionId，无法处理消息');
                        return;
                    }

                    const agentId = data.from;
                    if (!agentId) {
                        console.error('消息中缺少智能体ID (from字段)');
                        return;
                    }

                    console.log(`处理来自 ${agentId} 的消息, 类型: ${data.type}, 会话ID: ${currentSessionId}`);
                    
                    // 使用函数式更新，确保状态一定是最新的
                    if (data.type === 'message_chunk') {
                        // 强制使用函数式更新，确保总是获取到最新的sessionMessages状态
                        setSessionMessages((prevMessages) => {
                            console.log('更新前的消息状态:', JSON.stringify(prevMessages[currentSessionId] || []));
                            
                            const prevSessionMessages = prevMessages[currentSessionId] || [];
                            const lastMessage = prevSessionMessages.length > 0 
                                ? prevSessionMessages[prevSessionMessages.length - 1] 
                                : null;
                            
                            // 如果最后一条消息是来自该智能体且不是最终消息，则累积内容
                            let updatedMessages;
                            if (lastMessage && lastMessage.from === agentId && !lastMessage.isFinal) {
                                updatedMessages = [...prevSessionMessages];
                                updatedMessages[updatedMessages.length - 1] = {
                                    ...lastMessage,
                                    content: lastMessage.content + data.content,
                                    timestamp: new Date()
                                };
                            } else {
                                // 添加新消息
                                updatedMessages = [
                                    ...prevSessionMessages,
                                    {
                                        content: data.content || "",
                                        from: agentId,
                                        timestamp: new Date(),
                                        isFinal: false
                                    }
                                ];
                                console.log('添加新消息:', data.content);
                            }
                            
                            console.log('更新后的消息状态:', JSON.stringify(updatedMessages));
                            
                            // 确保返回完整的新状态对象
                            return {
                                ...prevMessages,
                                [currentSessionId]: updatedMessages
                            };
                        });
                        
                        // 更新会话的最后消息时间
                        updateSessionLastMessageTime(currentSessionId);
                    } else if (data.type === 'message') {
                        console.log(`收到完整消息: ${data.content?.substring(0, 50)}...`);
                        
                        setSessionMessages((prevMessages) => {
                            const prevSessionMessages = prevMessages[currentSessionId] || [];
                            const lastMessage = prevSessionMessages.length > 0 
                                ? prevSessionMessages[prevSessionMessages.length - 1] 
                                : null;
                            
                            let updatedMessages;
                            if (lastMessage && lastMessage.from === agentId && !lastMessage.isFinal) {
                                updatedMessages = [...prevSessionMessages];
                                updatedMessages[updatedMessages.length - 1] = {
                                    ...lastMessage,
                                    content: data.content || "",
                                    timestamp: new Date(),
                                    isFinal: true
                                };
                            } else {
                                updatedMessages = [
                                    ...prevSessionMessages,
                                    {
                                        content: data.content || "",
                                        from: agentId,
                                        timestamp: new Date(),
                                        isFinal: true
                                    }
                                ];
                                console.log('添加完整消息:', data.content);
                            }
                            
                            return {
                                ...prevMessages,
                                [currentSessionId]: updatedMessages
                            };
                        });
                        
                        // 更新会话的最后消息时间
                        updateSessionLastMessageTime(currentSessionId);
                    } else if (data.type === 'error') {
                        console.error('收到错误消息:', data.content);
                        // 显示错误消息
                        setSessionMessages(prev => {
                            const prevMessages = prev[currentSessionId] || [];
                            return {
                                ...prev,
                                [currentSessionId]: [
                                    ...prevMessages,
                                    {
                                        content: `错误: ${data.content}`,
                                        from: "system",
                                        timestamp: new Date(),
                                        isFinal: true
                                    }
                                ]
                            };
                        });
                    }
                } catch (error) {
                    console.error('解析WebSocket消息时出错:', error, '原始数据:', event.data);
                }
            };

            websocket.onclose = (event) => {
                console.log(`WebSocket连接已关闭: 代码=${event.code}, 原因=${event.reason}`);
                setWs(null);
                
                // 非正常关闭且不是组件卸载导致的关闭，尝试重连
                if (event.code !== 1000 && !unmounting) {
                    console.log('尝试在3秒后重新连接...');
                    setTimeout(connectWebSocket, 3000);
                }
            };

            websocket.onerror = (error) => {
                console.error('WebSocket错误:', error);
            };
        };
        
        // 标记组件是否已卸载
        let unmounting = false;
        
        // 初始化连接
        connectWebSocket();
        
        // 获取智能体列表
        fetch('http://localhost:8000/agents')
            .then(response => response.json())
            .then(data => {
                console.log('获取到的智能体列表:', data);
                setAgents(data.agents);
            })
            .catch(error => {
                console.error('获取智能体列表失败:', error);
            });

        console.log('WebSocket连接与currentSessionId:', currentSessionId);
        
        return () => {
            unmounting = true;
            if (websocket) {
                websocket.close(1000, "组件卸载");
            }
        };
    }, [currentSessionId]); // 添加依赖于currentSessionId，确保会话变更时重新建立正确连接

    // 更新会话的最后消息时间
    const updateSessionLastMessageTime = (sessionId: string, timestamp = new Date()) => {
        setSessions(prev => 
            prev.map(session => 
                session.id === sessionId 
                    ? { ...session, lastMessageAt: timestamp } 
                    : session
            )
        );
    };

    // 处理选择智能体
    const handleAgentSelect = (agent: Agent) => {
        // 设置选中的智能体
        setSelectedAgent(agent);
        
        // 查找该智能体的会话
        const agentSessions = sessions.filter(session => session.agentId === agent.id);
        
        // 如果存在会话，选择最近的一个
        if (agentSessions.length > 0) {
            // 按最后消息时间排序
            const sortedSessions = [...agentSessions].sort((a, b) => {
                const timeA = a.lastMessageAt ? a.lastMessageAt.getTime() : a.createdAt.getTime();
                const timeB = b.lastMessageAt ? b.lastMessageAt.getTime() : b.createdAt.getTime();
                return timeB - timeA;
            });
            
            setCurrentSessionId(sortedSessions[0].id);
        } else {
            // 如果没有会话，创建一个新的会话
            createNewSession(agent.id);
        }
        
        // 切换到会话视图
        setViewState('sessions');
    };

    // 创建一个返回到智能体列表的函数
    const backToAgentsList = () => {
        setViewState('agents');
    };

    // 创建新会话
    const createNewSession = (agentId: string, customName?: string) => {
        const agent = agents.find(a => a.id === agentId);
        if (!agent) return;
        
        const sessionName = customName || `与${agent.name}的对话 ${new Date().toLocaleString('zh-CN', { 
            month: 'numeric', 
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
        })}`;
        
        const newSessionId = uuidv4();
        const newSession: Session = {
            id: newSessionId,
            name: sessionName,
            agentId: agentId,
            createdAt: new Date()
        };
        
        setSessions(prev => [...prev, newSession]);
        setCurrentSessionId(newSessionId);
        
        return newSessionId;
    };

    // 重命名会话
    const renameSession = (sessionId: string, newName: string) => {
        setSessions(prev => 
            prev.map(session => 
                session.id === sessionId 
                    ? { ...session, name: newName } 
                    : session
            )
        );
    };

    // 修改删除会话函数以支持取消操作
    const cancelDelete = () => {
        setDeletingSessionId(null);
    };

    // 确认删除会话函数
    const confirmDelete = (sessionId: string) => {
        // 执行删除操作
        setSessions(prev => prev.filter(session => session.id !== sessionId));
        
        // 删除会话消息
        setSessionMessages(prev => {
            const newMessages = { ...prev };
            delete newMessages[sessionId];
            return newMessages;
        });
        
        // 如果删除的是当前会话，则选择同一智能体的另一个会话或创建新会话
        if (sessionId === currentSessionId && selectedAgent) {
            const remainingSessions = sessions.filter(
                session => session.id !== sessionId && session.agentId === selectedAgent.id
            );
            
            if (remainingSessions.length > 0) {
                // 选择最近的一个会话
                const mostRecentSession = remainingSessions.reduce((latest, current) => {
                    const latestTime = latest.lastMessageAt || latest.createdAt;
                    const currentTime = current.lastMessageAt || current.createdAt;
                    return currentTime > latestTime ? current : latest;
                });
                
                setCurrentSessionId(mostRecentSession.id);
            } else {
                // 创建新会话
                createNewSession(selectedAgent.id);
            }
        }
        
        // 重置删除状态
        setDeletingSessionId(null);
    };

    // 添加消息到会话的函数
    const addMessageToSession = (sessionId: string, message: Message) => {
        setSessionMessages(prev => ({
            ...prev,
            [sessionId]: [
                ...(prev[sessionId] || []),
                message
            ]
        }));
    };

    // 处理发送消息
    const handleSendMessage = (text: string) => {
        if (!selectedAgent || !currentSessionId) return;
        
        const timestamp = new Date();
        
        // 添加消息到当前会话
        addMessageToSession(currentSessionId, {
            content: text,
            from: 'user',
            timestamp,
            isFinal: true
        });
        
        // 将消息发送到WebSocket
        if (ws && ws.readyState === WebSocket.OPEN) {
            console.log(`发送消息到会话: ${currentSessionId}, 智能体: ${selectedAgent.id}`);
            try {
                const messageData = JSON.stringify({
                    type: 'message',
                    to: selectedAgent.id,
                    content: text,
                    stream: true,
                    session_id: currentSessionId
                });
                ws.send(messageData);
            } catch (error) {
                console.error('发送消息失败:', error);
                // 添加一条本地错误消息
                addMessageToSession(currentSessionId, {
                    content: "消息发送失败，请检查网络连接或刷新页面重试。",
                    from: "system",
                    timestamp: new Date(),
                    isFinal: true
                });
            }
        } else {
            console.error('WebSocket未连接，无法发送消息');
            // 添加一条本地错误消息
            addMessageToSession(currentSessionId, {
                content: "服务器连接已断开，请刷新页面重试。",
                from: "system",
                timestamp: new Date(),
                isFinal: true
            });
        }
        
        // 更新会话最后一次消息时间
        updateSessionLastMessageTime(currentSessionId, timestamp);
    };

    // 切换深色模式
    const toggleDarkMode = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        localStorage.setItem('darkMode', newDarkMode.toString());
    };

    // 切换侧边栏
    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    // 清除当前会话的消息历史
    const clearCurrentSessionMessages = () => {
        if (currentSessionId) {
            setSessionMessages(prev => ({
                ...prev,
                [currentSessionId]: []
            }));
            setClearModalOpen(false);
        }
    };

    // 清除所有消息历史
    const clearAllMessages = () => {
        setSessionMessages({});
        setClearModalOpen(false);
    };

    // 添加一个日期格式化辅助函数
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

    // 删除会话（保持为了兼容性，实际使用confirmDelete）
    const deleteSession = (sessionId: string) => {
        confirmDelete(sessionId);
    };

  return (
        <div className={`flex flex-col h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'}`}>
            {/* 顶部导航栏 */}
            <header className={`px-4 py-3 flex items-center justify-between ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm z-10`}>
                <div className="flex items-center">
                    <button 
                        onClick={toggleSidebar}
                        className={`mr-4 md:hidden p-2 rounded-md ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <div>
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold">智能体对话平台</h1>
                            <span className={`ml-2 text-sm font-light ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>· Powered by 北国的枫叶</span>
                        </div>
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-0.5`}>探索AI的无限可能</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    {/* 清除历史按钮 */}
                    <button 
                        onClick={() => setClearModalOpen(true)}
                        className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-red-300 hover:bg-gray-600' : 'bg-gray-100 text-red-500 hover:bg-gray-200'} transition-colors`}
                        title="清除历史记录"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                        </svg>
                    </button>
                    
                    {/* 深色模式切换按钮 */}
                    <button 
                        onClick={toggleDarkMode}
                        className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-100 text-gray-700'} transition-colors`}
                    >
                        {darkMode ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 102 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                            </svg>
                        )}
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* 左侧智能体列表 */}
                <motion.div
                    initial={{ x: sidebarOpen ? 0 : -320 }}
                    animate={{ x: sidebarOpen ? 0 : -320 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={`w-80 md:w-72 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg flex-shrink-0 md:relative absolute inset-y-0 left-0 z-10 h-full ${sidebarOpen ? 'overflow-y-auto' : 'overflow-hidden'}`}
                >
                    {viewState === 'agents' ? (
                        // 智能体列表视图
                        <>
                            <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                <h2 className="text-lg font-semibold">智能体列表</h2>
                            </div>
                            <div className="p-4">
                                {Object.entries(groupedAgents).map(([category, categoryAgents]) => (
                                    <div key={category} className="mb-6">
                                        <h3 className={`px-2 mb-3 text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                                            {category}
                                        </h3>
                                        <div className="space-y-3">
                                            {categoryAgents.map(agent => (
                                                <motion.div
                                                    key={agent.id}
                                                    onClick={() => handleAgentSelect(agent)}
                                                    className={`p-4 rounded-xl cursor-pointer transition-all ${
                                                        selectedAgent?.id === agent.id
                                                            ? darkMode 
                                                                ? 'bg-blue-900 border-blue-700 shadow-lg' 
                                                                : 'bg-blue-50 border-blue-200 shadow-md'
                                                            : darkMode
                                                                ? 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                                                                : 'bg-white border-gray-200 hover:bg-gray-50'
                                                    } border shadow-sm relative`}
                                                    whileHover={{ scale: 1.02, y: -2 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    {sessions.some(session => session.agentId === agent.id) && (
                                                        <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-blue-500"></div>
                                                    )}
                                                    <div className="flex items-center mb-2">
                                                        <div className={`text-xl mr-2 ${
                                                            selectedAgent?.id === agent.id
                                                                ? darkMode ? 'text-blue-300' : 'text-blue-500' 
                                                                : darkMode ? 'text-gray-400' : 'text-gray-600'
                                                        }`}>
                                                            {agent.id === 'python_expert' && '🐍'}
                                                            {agent.id === 'copywriting_expert' && '✍️'}
                                                            {agent.id === 'story_master' && '📚'}
                                                            {agent.id === 'rewrite_master' && '📝'}
                                                            {agent.id === 'xiaohongshu_expert' && '📱'}
                                                            {agent.id === 'crazy_thursday' && '🍗'}
                                                            {agent.id === 'deep_thinker' && '🧠'}
                                                            {agent.id === 'decision_expert' && '⚖️'}
                                                            {agent.id === 'food_critic' && '🍽️'}
                                                            {agent.id === 'debate_expert' && '🔥'}
                                                            {agent.id === 'ancient_style' && '📜'}
                                                            {!['python_expert', 'copywriting_expert', 'story_master', 'rewrite_master', 'xiaohongshu_expert', 'crazy_thursday', 'deep_thinker', 'decision_expert', 'food_critic', 'debate_expert', 'ancient_style'].includes(agent.id) && '🤖'}
                                                        </div>
                                                        <h3 className={`font-medium ${
                                                            selectedAgent?.id === agent.id
                                                                ? darkMode ? 'text-blue-200' : 'text-blue-600'
                                                                : ''
                                                        }`}>{agent.name}</h3>
                                                    </div>
                                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{agent.description}</p>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        // 会话管理视图
                        <>
                            <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center`}>
                                <button 
                                    onClick={backToAgentsList}
                                    className={`mr-2 p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                <div className="flex flex-col">
                                    <h2 className="text-lg font-semibold">{selectedAgent?.name}</h2>
                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{selectedAgent?.description}</p>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto p-4">
                                <h3 className={`mb-3 px-2 text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>对话管理</h3>
                                {selectedAgent && (
                                    <div className="space-y-2">
                                        {sessions
                                            .filter(session => session.agentId === selectedAgent.id)
                                            .sort((a, b) => {
                                                // 按最后消息时间排序，如果没有最后消息时间，则使用创建时间
                                                const timeA = a.lastMessageAt ? a.lastMessageAt.getTime() : a.createdAt.getTime();
                                                const timeB = b.lastMessageAt ? b.lastMessageAt.getTime() : b.createdAt.getTime();
                                                return timeB - timeA;
                                            })
                                            .map(session => (
                                                <div 
                                                    key={session.id}
                                                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                                                        session.id === currentSessionId
                                                            ? darkMode 
                                                                ? 'bg-blue-900 border-blue-700' 
                                                                : 'bg-blue-50 border-blue-200'
                                                            : darkMode
                                                                ? 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                                                                : 'bg-white border-gray-200 hover:bg-gray-50'
                                                    } border relative`}
                                                    onClick={() => {
                                                        if (editingSessionId !== session.id) {
                                                            setCurrentSessionId(session.id);
                                                        }
                                                    }}
                                                >
                                                    <div className="flex justify-between items-start mb-1">
                                                        {editingSessionId === session.id ? (
                                                            // 编辑模式 - 显示输入框
                                                            <input
                                                                type="text"
                                                                value={tempSessionName}
                                                                onChange={(e) => setTempSessionName(e.target.value)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        // 按下回车保存
                                                                        if (tempSessionName.trim()) {
                                                                            renameSession(session.id, tempSessionName.trim());
                                                                            setEditingSessionId(null);
                                                                        }
                                                                    } else if (e.key === 'Escape') {
                                                                        // 按下ESC取消
                                                                        setEditingSessionId(null);
                                                                    }
                                                                }}
                                                                onBlur={() => {
                                                                    // 失去焦点时保存更改
                                                                    if (tempSessionName.trim()) {
                                                                        renameSession(session.id, tempSessionName.trim());
                                                                    }
                                                                    setEditingSessionId(null);
                                                                }}
                                                                autoFocus
                                                                className={`flex-1 bg-transparent border-b outline-none px-1 py-0.5 ${
                                                                    darkMode 
                                                                        ? 'border-blue-400 text-blue-100' 
                                                                        : 'border-blue-400 text-blue-700'
                                                                }`}
                                                            />
                                                        ) : (
                                                            // 显示模式 - 显示名称文本
                                                            <div className={`font-medium ${
                                                                session.id === currentSessionId
                                                                    ? darkMode ? 'text-blue-200' : 'text-blue-600'
                                                                    : ''
                                                            }`}>
                                                                {session.name}
                                                            </div>
                                                        )}
                                                        <div className="flex">
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingSessionId(session.id);
                                                                    setTempSessionName(session.name);
                                                                }}
                                                                className={`p-1 text-xs rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} mr-1 ${editingSessionId === session.id ? 'hidden' : ''}`}
                                                                title="重命名会话"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </button>
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDeletingSessionId(session.id);
                                                                }}
                                                                className={`p-1 text-xs rounded ${darkMode ? 'hover:bg-gray-700 text-red-300' : 'hover:bg-gray-100 text-red-500'} ${editingSessionId === session.id ? 'hidden' : ''}`}
                                                                title="删除会话"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        {session.lastMessageAt ? (
                                                            <>上次活动: {formatDate(session.lastMessageAt)}</>
                                                        ) : (
                                                            <>创建于: {formatDate(session.createdAt)}</>
                                                        )}
                                                    </div>
                                                    
                                                    {/* 删除确认界面 */}
                                                    {deletingSessionId === session.id && (
                                                        <motion.div 
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: "auto" }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className={`mt-2 pt-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <p className={`text-xs mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>确定删除此会话吗？</p>
                                                            <div className="flex space-x-2">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        confirmDelete(session.id);
                                                                    }}
                                                                    className={`px-2 py-1 text-xs rounded ${darkMode ? 'bg-red-800 hover:bg-red-700 text-white' : 'bg-red-100 hover:bg-red-200 text-red-700'} transition-colors flex-1`}
                                                                >
                                                                    删除
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        cancelDelete();
                                                                    }}
                                                                    className={`px-2 py-1 text-xs rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors flex-1`}
                                                                >
                                                                    取消
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </div>
                                            ))
                                        }
                                        <button
                                            onClick={() => createNewSession(selectedAgent.id)}
                                            className={`flex items-center justify-center w-full py-2 rounded-lg ${
                                                darkMode 
                                                    ? 'bg-blue-800 text-blue-200 hover:bg-blue-700' 
                                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                            } transition-colors`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                            </svg>
                                            <span>新建会话</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </motion.div>

                {/* 主内容区 */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {selectedAgent && currentSessionId ? (
                        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                            <ChatWindow
                                agentId={selectedAgent.id}
                                agentName={selectedAgent.name}
                                messages={currentSessionId ? (sessionMessages[currentSessionId] || []) : []}
                                onSendMessage={handleSendMessage}
                                darkMode={darkMode}
                                onClearHistory={clearCurrentSessionMessages}
                            />
                        </div>
                    ) : (
                        <div className={`flex-1 flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            <motion.div 
                                className="text-center p-8 rounded-2xl"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <motion.div 
                                    className="text-7xl mb-6 inline-block"
                                    animate={{ 
                                        scale: [1, 1.1, 1],
                                        rotate: [0, 5, -5, 0]
                                    }}
                                    transition={{ 
                                        duration: 2,
                                        repeat: Infinity,
                                        repeatType: "reverse"
                                    }}
                                >
                                    🤖
                                </motion.div>
                                <h2 className="text-2xl font-bold mb-4">
                                    欢迎使用智能体对话平台
                                </h2>
                                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-md`}>
                                    请从左侧选择一个智能体开启对话。每个智能体都有不同的专长和能力，选择最适合您需求的智能体获得最佳体验。
                                </p>
                                {!sidebarOpen && (
                                    <motion.button
                                        className={`mt-6 px-4 py-2 rounded-md ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors`}
                                        onClick={toggleSidebar}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        查看智能体列表
                                    </motion.button>
                                )}
                            </motion.div>
                        </div>
                    )}
                </div>
            </div>

            {/* 清除历史对话框 */}
            {clearModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div 
                        className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-lg shadow-xl p-6 w-full max-w-md`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        <h3 className="text-xl font-bold mb-4">清除历史记录</h3>
                        <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            选择要清除的历史记录范围。此操作无法撤销！
                        </p>
                        <div className="flex flex-col space-y-3">
                            {currentSessionId && (
                                <button 
                                    onClick={clearCurrentSessionMessages}
                                    className={`px-4 py-2 rounded-md ${darkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-100 hover:bg-blue-200'} ${darkMode ? 'text-white' : 'text-blue-800'} transition-colors text-left`}
                                >
                                    <div className="font-medium">仅清除当前会话记录</div>
                                    <div className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-600'}`}>
                                        {sessions.find(s => s.id === currentSessionId)?.name}
                                    </div>
                                </button>
                            )}
                            
                            <button 
                                onClick={clearAllMessages}
                                className={`px-4 py-2 rounded-md ${darkMode ? 'bg-red-900 hover:bg-red-800' : 'bg-red-100 hover:bg-red-200'} ${darkMode ? 'text-white' : 'text-red-800'} transition-colors text-left`}
                            >
                                <div className="font-medium">清除所有历史记录</div>
                                <div className={`text-sm ${darkMode ? 'text-red-200' : 'text-red-600'}`}>将清除所有会话的对话历史</div>
                            </button>
                            
                            <button 
                                onClick={() => setClearModalOpen(false)}
                                className={`px-4 py-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                            >
                                取消
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* 背景遮罩，点击关闭侧边栏 */}
            {sidebarOpen && window.innerWidth < 768 && (
                <div 
                    className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-0"
                    onClick={toggleSidebar}
                />
            )}
    </div>
  );
};

export default App;