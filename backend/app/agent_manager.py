from typing import Dict, List, Optional, AsyncGenerator
from abc import ABC, abstractmethod
import dashscope

class BaseAgent(ABC):
    def __init__(self, agent_id: str, name: str, description: str):
        self.id = agent_id  # 更改为id以匹配前端期望
        self.agent_id = agent_id  # 保留agent_id以向后兼容
        self.name = name
        self.description = description
        self.category = "未分类"  # 添加分类字段，默认为"未分类"
        self.system_prompt = ""  # 添加系统提示字段
        
    async def process_message(self, message: str) -> str:
        """处理接收到的消息并返回响应，默认实现通过收集process_message_stream的结果"""
        full_response = ""
        async for chunk in self.process_message_stream(message):
            full_response += chunk
        return full_response
    
    @abstractmethod
    async def process_message_stream(self, message: str) -> AsyncGenerator[str, None]:
        """流式处理接收到的消息并返回响应流"""
        raise NotImplementedError
    
    async def process_message_with_history(self, messages: List[Dict[str, str]]) -> str:
        """处理带历史记录的消息，默认实现通过收集process_message_stream_with_history的结果"""
        full_response = ""
        async for chunk in self.process_message_stream_with_history(messages):
            full_response += chunk
        return full_response
    
    async def process_message_stream_with_history(self, messages: List[Dict[str, str]]) -> AsyncGenerator[str, None]:
        """流式处理带历史记录的消息，默认实现为直接处理最新的用户消息"""
        last_user_message = None
        for msg in reversed(messages):
            if msg["role"] == "user":
                last_user_message = msg["content"]
                break
        
        if last_user_message:
            async for chunk in self.process_message_stream(last_user_message):
                yield chunk
        else:
            yield "未找到用户消息"
    
    @abstractmethod
    async def initialize(self) -> str:
        """初始化智能体"""
        return ""

class AgentManager:
    def __init__(self):
        self.agents: Dict[str, BaseAgent] = {}
        self.current_api_key: Optional[str] = None
    
    def register_agent(self, agent: BaseAgent):
        """注册一个新的智能体"""
        self.agents[agent.id] = agent
    
    def get_agent(self, agent_id: str) -> BaseAgent:
        """获取指定ID的智能体"""
        return self.agents.get(agent_id)
    
    def get_all_agents(self) -> List[BaseAgent]:
        """获取所有已注册的智能体"""
        return list(self.agents.values())
    
    async def process_message(self, agent_id: str, message: str) -> str:
        """处理消息并返回响应"""
        agent = self.agents.get(agent_id)
        if agent:
            return await agent.process_message(message)
        return f"未找到ID为 {agent_id} 的智能体"
    
    async def process_message_stream(self, agent_id: str, message: str) -> AsyncGenerator[str, None]:
        """流式处理消息并返回响应流"""
        agent = self.agents.get(agent_id)
        if agent:
            async for response_chunk in agent.process_message_stream(message):
                yield response_chunk
        else:
            yield f"未找到ID为 {agent_id} 的智能体"
    
    async def process_message_with_history(self, agent_id: str, messages: List[Dict[str, str]]) -> str:
        """处理带历史记录的消息并返回响应"""
        agent = self.agents.get(agent_id)
        if agent:
            return await agent.process_message_with_history(messages)
        return f"未找到ID为 {agent_id} 的智能体"
    
    async def process_message_stream_with_history(self, agent_id: str, messages: List[Dict[str, str]]) -> AsyncGenerator[str, None]:
        """流式处理带历史记录的消息并返回响应流"""
        agent = self.agents.get(agent_id)
        if agent:
            async for response_chunk in agent.process_message_stream_with_history(messages):
                yield response_chunk
        else:
            yield f"未找到ID为 {agent_id} 的智能体"
    
    def set_api_key(self, api_key: str):
        """设置全局API Key"""
        self.current_api_key = api_key
        dashscope.api_key = api_key
        print(f"API Key已更新: {'已设置' if api_key else '已清除'}")
    
    def get_api_key(self) -> Optional[str]:
        """获取当前API Key"""
        return self.current_api_key
    
    def clear_api_key(self):
        """清除API Key"""
        self.current_api_key = None
        dashscope.api_key = None
        print("API Key已清除")

# 创建全局智能体管理器实例
agent_manager = AgentManager()