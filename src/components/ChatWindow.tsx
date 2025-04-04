import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Message {
    content: string;
    from: string;
    timestamp: Date;
    isFinal?: boolean;
}

interface ChatWindowProps {
    agentId: string;
    agentName: string;
    messages: Message[];
    onSendMessage: (message: string) => void;
    darkMode?: boolean;
    onClearHistory?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
    agentId,
    agentName,
    messages,
    onSendMessage,
    darkMode = false,
    onClearHistory
}) => {
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
    const [copiedCodeBlockId, setCopiedCodeBlockId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [autoScroll, setAutoScroll] = useState(true);
    const messageContainerRef = useRef<HTMLDivElement>(null);

    // 自动调整文本框高度
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = '44px';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [inputMessage]);

    // 检测是否有未完成的消息（正在打字中）
    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        setIsTyping(lastMessage && lastMessage.from !== 'user' && lastMessage.isFinal === false);
    }, [messages]);

    // 滚动到底部的函数
    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    // 修改useEffect钩子以确保滚动到最新消息
    useEffect(() => {
        // 当新消息添加时滚动到底部
        if (messagesEndRef.current && messages.length > 0) {
            console.log('滚动到最新消息');
            scrollToBottom();
        }
    }, [messages]);

    // 检测用户是否手动滚动，用于决定是否取消自动滚动
    const handleScroll = () => {
        if (!messageContainerRef.current) return;
        
        const { scrollTop, scrollHeight, clientHeight } = messageContainerRef.current;
        const isScrolledNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        
        // 如果用户已滚动至接近底部，重新启用自动滚动
        if (isScrolledNearBottom && !autoScroll) {
            setAutoScroll(true);
        }
        // 如果用户向上滚动，禁用自动滚动
        else if (!isScrolledNearBottom && autoScroll) {
            setAutoScroll(false);
        }
    };

    const handleSendMessage = () => {
        if (inputMessage.trim()) {
            onSendMessage(inputMessage.trim());
            setInputMessage('');
            if (textareaRef.current) {
                textareaRef.current.style.height = '44px';
            }
        }
    };

    // 获取智能体头像
    const getAgentAvatar = () => {
        // 可以根据agentId返回不同的头像
        switch(agentId) {
            case 'python_expert':
                return '🐍';
            case 'copywriting_expert':
                return '✍️';
            case 'story_master':
                return '📚';
            case 'rewrite_master':
                return '📝';
            case 'xiaohongshu_expert':
                return '📱';
            case 'crazy_thursday':
                return '🍗';
            case 'deep_thinker':
                return '🧠';
            case 'decision_expert':
                return '⚖️';
            case 'food_critic':
                return '🍽️';
            case 'debate_expert':
                return '🔥';
            case 'ancient_style':
                return '📜';
            default:
                return '🤖';
        }
    };

    // 复制消息内容
    const copyMessageToClipboard = (content: string, index: number) => {
        navigator.clipboard.writeText(content).then(() => {
            setCopiedMessageId(index);
            setTimeout(() => setCopiedMessageId(null), 2000);
        });
    };
    
    // 格式化文件大小
    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    };

    // 获取文件图标
    const getFileIcon = (fileName: string) => {
        const extension = fileName.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'pdf':
                return '📄';
            case 'doc':
            case 'docx':
                return '📝';
            case 'xls':
            case 'xlsx':
                return '📊';
            case 'ppt':
            case 'pptx':
                return '📽️';
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'svg':
                return '🖼️';
            case 'zip':
            case 'rar':
            case '7z':
                return '📦';
            case 'txt':
                return '📃';
            case 'py':
                return '🐍';
            case 'js':
            case 'ts':
                return '📜';
            case 'html':
            case 'css':
                return '🌐';
            default:
                return '📄';
        }
    };

    // 添加一个辅助函数处理波浪符，防止被误解析为删除线
    const escapeTildes = (content: string): string => {
        // 将单个波浪符替换为HTML实体，避免被Markdown解析为删除线格式
        // 只替换单独的波浪符，不替换成对的波浪符（~~删除线~~）
        return content.replace(/([^~])~([^~])/g, '$1&#126;$2')
                   .replace(/^~([^~])/g, '&#126;$1')  // 处理开头的波浪符
                   .replace(/([^~])~$/g, '$1&#126;'); // 处理结尾的波浪符
    };

    // 修改复制代码函数，使用更可靠的视觉反馈方式
    const copyToClipboard = (text: string, event: React.MouseEvent): Promise<void> => {
        // 获取按钮元素
        const button = event.currentTarget as HTMLButtonElement;
        const originalText = button.innerHTML;
        const originalClass = button.className;
        
        // 改变按钮样式和内容
        button.innerHTML = `<span>已复制！</span>`;
        button.className = `${originalClass.replace('opacity-0 group-hover:opacity-100', 'opacity-100')} ${
            darkMode ? 'bg-green-700 text-white' : 'bg-green-500 text-white'
        }`;
        
        // 2秒后恢复原来的样式和内容
        setTimeout(() => {
            button.innerHTML = originalText;
            button.className = originalClass;
        }, 2000);
        
        return navigator.clipboard.writeText(text);
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* 聊天窗口头部 */}
            <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} ${darkMode ? 'bg-gray-800' : 'bg-white'} flex-shrink-0`}>
                <div className="flex items-center">
                    <div className="flex-shrink-0 mr-3 text-2xl">
                        {getAgentAvatar()}
                    </div>
                    <div>
                        <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{agentName}</h2>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {isTyping ? '正在输入...' : '在线'}
                        </p>
                    </div>
                </div>
            </div>
            
            {/* 消息列表区域 - 添加滚动事件监听 */}
            <div 
                ref={messageContainerRef}
                className={`flex-1 overflow-y-auto p-4 space-y-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
                onScroll={handleScroll}
            >
                <AnimatePresence>
                    {messages.map((message, index) => {
                        console.log(`渲染消息 ${index}:`, message.from, message.content?.substring(0, 50));
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className={`flex ${message.from === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {message.from !== 'user' && (
                                    <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mr-2 text-lg">
                                        {getAgentAvatar()}
                                    </div>
                                )}
                                <div
                                    className={`max-w-[75%] rounded-2xl p-3 ${
                                        message.from === 'user'
                                            ? darkMode 
                                              ? 'bg-blue-600 text-white' 
                                              : 'bg-blue-500 text-white'
                                            : darkMode
                                              ? 'bg-gray-800 text-gray-200 border border-gray-700'
                                              : 'bg-white text-gray-800 shadow-sm'
                                    } relative group`}
                                >
                                    <button 
                                        onClick={() => copyMessageToClipboard(message.content, index)} 
                                        className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100 ${
                                            message.from === 'user'
                                                ? 'bg-blue-700 hover:bg-blue-800 text-blue-200'
                                                : darkMode 
                                                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                        } shadow-md`}
                                        title="复制内容"
                                    >
                                        {copiedMessageId === index ? (
                                            <div className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                <span className="text-xs ml-1">已复制</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                                <span className="text-xs ml-1">复制</span>
                                            </div>
                                        )}
                                    </button>

                                    {/* 使用ReactMarkdown渲染消息内容 */}
                                    <div className="whitespace-pre-wrap break-words markdown-body">
                                        {message.from !== 'user' ? (
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm, remarkMath]}
                                                rehypePlugins={[rehypeKatex]}
                                                components={{
                                                    code({node, inline, className, children, ...props}: any) {
                                                        const match = /language-(\w+)/.exec(className || '')
                                                        const codeText = String(children).replace(/\n$/, '');
                                                        
                                                        // 对于非内联且有语言标识的代码块，添加复制按钮
                                                        return !inline && match ? (
                                                            <div className="relative group">
                                                                <button 
                                                                    onClick={(e) => {
                                                                        copyToClipboard(codeText, e).then(() => {
                                                                            console.log('代码已复制到剪贴板');
                                                                        });
                                                                    }}
                                                                    className={`absolute top-2 right-2 p-1.5 rounded ${
                                                                        darkMode 
                                                                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                                                                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                                                    } opacity-0 group-hover:opacity-100 transition-opacity z-10 text-xs flex items-center`}
                                                                    title="复制代码"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                                    </svg>
                                                                    复制
                                                                </button>
                                                                <SyntaxHighlighter
                                                                    style={darkMode ? vscDarkPlus : vs}
                                                                    language={match[1]}
                                                                    PreTag="div"
                                                                    {...props}
                                                                >
                                                                    {codeText}
                                                                </SyntaxHighlighter>
                                                            </div>
                                                        ) : (
                                                            <code className={className} {...props}>
                                                                {children}
                                                            </code>
                                                        )
                                                    },
                                                    table({node, className, children, ...props}: any) {
                                                        return (
                                                            <div className="overflow-x-auto my-2">
                                                                <table className={`border-collapse ${darkMode ? 'text-gray-200' : 'text-gray-800'} ${className}`} {...props}>
                                                                    {children}
                                                                </table>
                                                            </div>
                                                        )
                                                    },
                                                    thead({node, className, children, ...props}: any) {
                                                        return (
                                                            <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} ${className}`} {...props}>
                                                                {children}
                                                            </thead>
                                                        )
                                                    },
                                                    tr({node, className, children, ...props}: any) {
                                                        return (
                                                            <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} ${className}`} {...props}>
                                                                {children}
                                                            </tr>
                                                        )
                                                    },
                                                    th({node, className, children, ...props}: any) {
                                                        return (
                                                            <th className={`px-4 py-2 ${className}`} {...props}>
                                                                {children}
                                                            </th>
                                                        )
                                                    },
                                                    td({node, className, children, ...props}: any) {
                                                        return (
                                                            <td className={`px-4 py-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'} border ${className}`} {...props}>
                                                                {children}
                                                            </td>
                                                        )
                                                    },
                                                    a({node, className, children, ...props}: any) {
                                                        return (
                                                            <a 
                                                                className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} underline ${className}`} 
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                {...props}
                                                            >
                                                                {children}
                                                            </a>
                                                        )
                                                    },
                                                    img({node, className, ...props}: any) {
                                                        return (
                                                            <img 
                                                                className={`max-w-full rounded my-2 ${className}`} 
                                                                style={{ maxHeight: '300px' }}
                                                                {...props} 
                                                            />
                                                        )
                                                    },
                                                    blockquote({node, className, children, ...props}: any) {
                                                        return (
                                                            <blockquote 
                                                                className={`border-l-4 ${darkMode ? 'border-gray-600 bg-gray-700 bg-opacity-50' : 'border-gray-300 bg-gray-100'} pl-4 py-1 my-2 italic ${className}`}
                                                                {...props}
                                                            >
                                                                {children}
                                                            </blockquote>
                                                        )
                                                    },
                                                    hr({node, className, ...props}: any) {
                                                        return (
                                                            <hr 
                                                                className={`my-4 ${darkMode ? 'border-gray-600' : 'border-gray-300'} ${className}`}
                                                                {...props}
                                                            />
                                                        )
                                                    }
                                                }}
                                            >
                                                {escapeTildes(message.content || "")}
                                            </ReactMarkdown>
                                        ) : (
                                            // 用户消息保持简单文本格式
                                            <div dangerouslySetInnerHTML={{ __html: (message.content || "").replace(/\n/g, '<br/>') }} />
                                        )}
                                    </div>
                                    
                                    <span className={`text-xs mt-1 block ${
                                        message.from === 'user' 
                                            ? 'text-blue-200' 
                                            : darkMode ? 'text-gray-500' : 'text-gray-500'
                                    }`}>
                                        {message.timestamp.toLocaleTimeString()}
                                    </span>
                                </div>
                                {message.from === 'user' && (
                                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center ml-2">
                                        <span className="text-blue-500 text-sm">我</span>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                
                {/* 智能体"正在输入"指示器 */}
                {isTyping && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center"
                    >
                        <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mr-2 text-lg">
                            {getAgentAvatar()}
                        </div>
                        <div className={`p-3 rounded-2xl ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow-sm'}`}>
                            <div className="flex space-x-1">
                                <motion.div 
                                    className={`h-2 w-2 rounded-full ${darkMode ? 'bg-gray-500' : 'bg-gray-400'}`}
                                    animate={{ y: [0, -5, 0] }}
                                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                                />
                                <motion.div 
                                    className={`h-2 w-2 rounded-full ${darkMode ? 'bg-gray-500' : 'bg-gray-400'}`}
                                    animate={{ y: [0, -5, 0] }}
                                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                                />
                                <motion.div 
                                    className={`h-2 w-2 rounded-full ${darkMode ? 'bg-gray-500' : 'bg-gray-400'}`}
                                    animate={{ y: [0, -5, 0] }}
                                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
                
                {/* 没有消息时的提示 */}
                {messages.length === 0 && (
                    <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <div className="text-3xl mb-3">👋</div>
                        <p>与{agentName}的对话将会显示在这里</p>
                        <p className="text-sm mt-1">开始发送消息吧！</p>
                    </div>
                )}
                
                {/* 滚动到底部的锚点 */}
                <div ref={messagesEndRef} />
            </div>
            
            {/* 自动滚动控制按钮 */}
            {messages.length > 0 && !autoScroll && (
                <button
                    onClick={() => {
                        setAutoScroll(true);
                        scrollToBottom();
                    }}
                    className={`absolute bottom-24 right-6 p-2 rounded-full shadow-lg ${
                        darkMode ? 'bg-gray-700 text-blue-300' : 'bg-white text-blue-600'
                    } z-10`}
                    title="滚动到最新消息"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            )}
            
            {/* 输入区域 */}
            <div className={`p-4 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} flex-shrink-0`}>
                <div className="flex items-end space-x-2">
                    <div className={`flex-1 p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-2xl`}>
                        <textarea
                            ref={textareaRef}
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="输入消息..."
                            className={`w-full bg-transparent border-0 focus:outline-none resize-none ${darkMode ? 'text-white placeholder-gray-400' : 'text-gray-800 placeholder-gray-500'}`}
                            rows={1}
                            style={{ minHeight: '24px', maxHeight: '120px' }}
                        />
                    </div>
                    <motion.button
                        onClick={handleSendMessage}
                        className={`p-3 ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-full flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50`}
                        disabled={!inputMessage.trim()}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </motion.button>
                </div>
                <div className={`mt-2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} text-center`}>
                    按Enter发送，Shift+Enter换行
                </div>
            </div>
        </div>
    );
};

export default ChatWindow; 