from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List
import json
import uuid
import asyncio
from backend.app.agent_manager import agent_manager
from backend.agents.story_agent import StoryAgent
from backend.agents.rewrite_agent import RewriteAgent
from backend.agents.copywriting_agent import CopywritingAgent
from backend.agents.python_agent import PythonAgent
from backend.agents.xiaohongshu_agent import XiaohongshuAgent
from backend.agents.crazy_thursday_agent import CrazyThursdayAgent
from backend.agents.deep_thinker_agent import DeepThinkerAgent
from backend.agents.decision_expert_agent import DecisionExpertAgent
from backend.agents.food_critic_agent import FoodCriticAgent
from backend.agents.debate_expert_agent import DebateExpertAgent
from backend.agents.ancient_style_agent import AncientStyleAgent

app = FastAPI()

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 存储活跃的WebSocket连接
active_connections: Dict[str, WebSocket] = {}

# 为每个会话存储对话历史
chat_history: Dict[str, List[Dict]] = {}

# 注册智能体
story_agent = StoryAgent()
rewrite_agent = RewriteAgent()
copywriting_agent = CopywritingAgent()
python_agent = PythonAgent()
xiaohongshu_agent = XiaohongshuAgent()

# 添加分类信息
story_agent.category = "文字创作"
rewrite_agent.category = "文字创作"
xiaohongshu_agent.category = "文字创作"
copywriting_agent.category = "角色类"
python_agent.category = "角色类"

# 创建并注册疯狂星期四智能体
crazy_thursday_agent = CrazyThursdayAgent()
crazy_thursday_agent.category = "娱乐类"

# 创建并注册深度思考者智能体
deep_thinker_agent = DeepThinkerAgent()
deep_thinker_agent.category = "角色类"

# 创建并注册决策专家智能体
decision_expert_agent = DecisionExpertAgent()
decision_expert_agent.category = "角色类"

# 创建并注册孤独的美食家智能体
food_critic_agent = FoodCriticAgent()
food_critic_agent.category = "角色类"

# 创建并注册吵架小能手智能体
debate_expert_agent = DebateExpertAgent()
debate_expert_agent.category = "娱乐类"

# 创建并注册文言喷子智能体
ancient_style_agent = AncientStyleAgent()
ancient_style_agent.category = "娱乐类"

agent_manager.register_agent(story_agent)
agent_manager.register_agent(rewrite_agent)
agent_manager.register_agent(xiaohongshu_agent)
agent_manager.register_agent(copywriting_agent)
agent_manager.register_agent(python_agent)
agent_manager.register_agent(crazy_thursday_agent)
agent_manager.register_agent(deep_thinker_agent)
agent_manager.register_agent(decision_expert_agent)
agent_manager.register_agent(food_critic_agent)
agent_manager.register_agent(debate_expert_agent)
agent_manager.register_agent(ancient_style_agent)

@app.get("/")
async def root():
    return {"message": "本地智能体服务器运行中"}

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket.accept()
    active_connections[client_id] = websocket
    print(f"WebSocket连接已建立: client_id={client_id}")
    
    try:
        while True:
            data = await websocket.receive_text()
            print(f"收到原始数据: {data}")
            
            try:
                message = json.loads(data)
                print(f"解析后的消息: {message}")  # 详细日志
                
                # 处理消息
                agent_id = message.get('to')
                content = message.get('content', '')
                message_type = message.get('type', 'message')
                stream_mode = message.get('stream', True)  # 默认使用流式输出
                session_id = message.get('session_id', 'default')  # 获取会话ID
                
                print(f"消息详情: agent_id={agent_id}, type={message_type}, session_id={session_id}, content={content[:50]+'...' if len(content)>50 else content}")
                
                # 创建会话历史的唯一键
                session_key = f"{agent_id}:{session_id}"
                
                if agent_id:
                    agent = agent_manager.get_agent(agent_id)
                    if not agent:
                        print(f"错误: 未找到智能体 {agent_id}")
                        await websocket.send_json({
                            "type": "error",
                            "content": f"未找到ID为 {agent_id} 的智能体",
                            "from": "system"
                        })
                        continue
                        
                    if content:
                        print(f"处理消息: agent_id={agent_id}, content={content[:50]+'...' if len(content)>50 else content}")
                        
                        # 确保会话历史存在
                        if session_key not in chat_history:
                            print(f"为会话 {session_key} 创建新的历史记录")
                            chat_history[session_key] = []
                        
                        # 添加用户消息到对话历史
                        chat_history[session_key].append({"role": "user", "content": content})
                        
                        # 构建包含历史消息的完整消息列表
                        messages = [
                            {"role": "system", "content": agent.system_prompt}
                        ] + chat_history[session_key]
                        
                        print(f"会话ID: {session_id}, 智能体: {agent_id}, 历史记录长度: {len(chat_history[session_key])}")
                        print(f"发送到智能体的完整消息列表: {messages}")
                        
                        try:
                            if stream_mode:
                                # 流式响应处理
                                print(f"使用流式处理响应: agent_id={agent_id}")
                                full_response = ""
                                async for response_chunk in agent_manager.process_message_stream_with_history(agent_id, messages):
                                    print(f"收到流式响应片段: {response_chunk[:30]+'...' if len(response_chunk)>30 else response_chunk}")
                                    # 每次只发送新增的部分，而不是累积的全部内容
                                    await websocket.send_json({
                                        "type": "message_chunk",
                                        "content": response_chunk,  # 只发送新的响应片段
                                        "from": agent_id,
                                        "is_final": False
                                    })
                                    full_response += response_chunk
                                
                                print(f"流式响应完成，发送最终消息")
                                # 发送完成标记
                                await websocket.send_json({
                                    "type": "message",
                                    "content": full_response,
                                    "from": agent_id,
                                    "is_final": True
                                })
                                
                                # 添加智能体回复到对话历史
                                chat_history[session_key].append({"role": "assistant", "content": full_response})
                            else:
                                # 传统的一次性响应
                                print(f"使用传统一次性响应: agent_id={agent_id}")
                                response = await agent_manager.process_message_with_history(agent_id, messages)
                                print(f"收到一次性响应: {response[:50]+'...' if len(response)>50 else response}")
                                await websocket.send_json({
                                    "type": "message",
                                    "content": response,
                                    "from": agent_id
                                })
                                
                                # 添加智能体回复到对话历史
                                chat_history[session_key].append({"role": "assistant", "content": response})
                        except Exception as e:
                            error_msg = f"处理消息时发生错误: {str(e)}"
                            print(f"错误: {error_msg}")
                            await websocket.send_json({
                                "type": "error",
                                "content": error_msg,
                                "from": "system"
                            })
                else:
                    print("错误: 消息中缺少智能体ID")
                    await websocket.send_json({
                        "type": "error",
                        "content": "消息中缺少智能体ID",
                        "from": "system"
                    })
            except json.JSONDecodeError as e:
                print(f"JSON解析错误: {str(e)}, 数据: {data}")
                await websocket.send_json({
                    "type": "error",
                    "content": f"消息格式不正确: {str(e)}",
                    "from": "system"
                })
            except Exception as e:
                print(f"处理消息时发生未知错误: {str(e)}")
                await websocket.send_json({
                    "type": "error",
                    "content": f"服务器错误: {str(e)}",
                    "from": "system"
                })
    except WebSocketDisconnect:
        print(f"WebSocket连接已断开: client_id={client_id}")
        if client_id in active_connections:
            del active_connections[client_id]
    except Exception as e:
        print(f"WebSocket错误: {str(e)}")
        if client_id in active_connections:
            del active_connections[client_id]

@app.get("/agents")
async def get_agents():
    agents = agent_manager.get_all_agents()
    return {
        "agents": [
            {
                "id": agent.id,
                "name": agent.name,
                "description": agent.description,
                "category": agent.category
            }
            for agent in agents
        ]
    } 