import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ApiKeyManagerProps {
    isOpen: boolean;
    onClose: () => void;
    darkMode: boolean;
    onApiKeyUpdate: (apiKey: string) => void;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ isOpen, onClose, darkMode, onApiKeyUpdate }) => {
    const [apiKey, setApiKey] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<{
        isValid: boolean;
        message: string;
    } | null>(null);
    const [showKey, setShowKey] = useState(false);

    // 从localStorage加载已保存的API Key
    useEffect(() => {
        const savedApiKey = localStorage.getItem('dashscope_api_key');
        if (savedApiKey) {
            setApiKey(savedApiKey);
        }
    }, [isOpen]);

    // 验证API Key
    const validateApiKey = async () => {
        if (!apiKey.trim()) {
            setValidationResult({
                isValid: false,
                message: '请输入API Key'
            });
            return;
        }

        setIsValidating(true);
        setValidationResult(null);

        try {
            const response = await fetch('http://localhost:8000/api/validate-key', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ api_key: apiKey.trim() })
            });

            const result = await response.json();

            if (response.ok && result.valid) {
                setValidationResult({
                    isValid: true,
                    message: 'API Key 验证成功！'
                });
            } else {
                setValidationResult({
                    isValid: false,
                    message: result.message || 'API Key 验证失败'
                });
            }
        } catch (error) {
            console.error('验证API Key时出错:', error);
            setValidationResult({
                isValid: false,
                message: '网络错误，请检查后端服务是否正常运行'
            });
        } finally {
            setIsValidating(false);
        }
    };

    // 保存API Key
    const saveApiKey = () => {
        if (validationResult?.isValid) {
            localStorage.setItem('dashscope_api_key', apiKey.trim());
            onApiKeyUpdate(apiKey.trim());
            onClose();
        }
    };

    // 清除API Key
    const clearApiKey = () => {
        setApiKey('');
        localStorage.removeItem('dashscope_api_key');
        setValidationResult(null);
        onApiKeyUpdate('');
    };

    // 关闭弹窗时重置状态
    const handleClose = () => {
        setValidationResult(null);
        setShowKey(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <motion.div 
                    className={`${
                        darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
                    } rounded-lg shadow-xl p-6 w-full max-w-md`}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* 标题 */}
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold flex items-center">
                            <span className="mr-2">🔑</span>
                            API Key 管理
                        </h3>
                        <button 
                            onClick={handleClose}
                            className={`p-1 rounded-full ${
                                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                            } transition-colors`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* 说明文字 */}
                    <p className={`mb-4 text-sm ${
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                        请输入您的 DashScope API Key 以使用智能体服务。API Key 将安全地存储在本地浏览器中。
                    </p>

                    {/* API Key 输入框 */}
                    <div className="mb-4">
                        <label className={`block text-sm font-medium mb-2 ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                            DashScope API Key
                        </label>
                        <div className="relative">
                            <input
                                type={showKey ? 'text' : 'password'}
                                value={apiKey}
                                onChange={(e) => {
                                    setApiKey(e.target.value);
                                    setValidationResult(null);
                                }}
                                placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 ${
                                    darkMode 
                                        ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500' 
                                        : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                                }`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className={`absolute inset-y-0 right-0 pr-3 flex items-center ${
                                    darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {showKey ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* 验证结果 */}
                    {validationResult && (
                        <motion.div 
                            className={`mb-4 p-3 rounded-md flex items-center ${
                                validationResult.isValid
                                    ? darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                                    : darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                            }`}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <span className="mr-2">
                                {validationResult.isValid ? '✅' : '❌'}
                            </span>
                            {validationResult.message}
                        </motion.div>
                    )}

                    {/* 按钮组 */}
                    <div className="flex flex-col space-y-3">
                        {/* 验证按钮 */}
                        <button 
                            onClick={validateApiKey}
                            disabled={isValidating || !apiKey.trim()}
                            className={`w-full px-4 py-2 rounded-md font-medium transition-colors flex items-center justify-center ${
                                darkMode 
                                    ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500' 
                                    : 'bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500'
                            } text-white disabled:cursor-not-allowed`}
                        >
                            {isValidating ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    验证中...
                                </>
                            ) : (
                                '验证 API Key'
                            )}
                        </button>

                        {/* 保存按钮 */}
                        {validationResult?.isValid && (
                            <motion.button 
                                onClick={saveApiKey}
                                className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
                                    darkMode 
                                        ? 'bg-green-600 hover:bg-green-700' 
                                        : 'bg-green-500 hover:bg-green-600'
                                } text-white`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                保存并应用
                            </motion.button>
                        )}

                        {/* 清除按钮 */}
                        {apiKey && (
                            <button 
                                onClick={clearApiKey}
                                className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
                                    darkMode 
                                        ? 'bg-red-600 hover:bg-red-700' 
                                        : 'bg-red-500 hover:bg-red-600'
                                } text-white`}
                            >
                                清除 API Key
                            </button>
                        )}

                        {/* 取消按钮 */}
                        <button 
                            onClick={handleClose}
                            className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
                                darkMode 
                                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                            }`}
                        >
                            取消
                        </button>
                    </div>

                    {/* 帮助链接 */}
                    <div className={`mt-4 text-xs text-center ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                        <p>
                            还没有 API Key？
                            <a 
                                href="https://dashscope.aliyun.com/" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={`ml-1 underline ${
                                    darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
                                }`}
                            >
                                前往 DashScope 获取
                            </a>
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ApiKeyManager;