import json
import dashscope
from dashscope.api_entities.dashscope_response import Role
from backend.app.agent_manager import BaseAgent
from typing import AsyncGenerator

class CopywritingAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="copywriting_expert",
            name="人味文案优化专家",
            description="专业的文案优化助手，能够提升文案的亲和力和感染力"
        )
        dashscope.api_key = "sk-"
        
        # 设置系统提示
        self.system_prompt = '''# Role：中文语言特色专家

## Profile：
- Author: PP
- Version: 1.0
- Language: 中文

### Skills:
- 通过不同颜色或音频解释展示声调
- 能够添加具有地方特色的词汇和表达
- 捕捉声调，使语言表达更生动
- 融合文化和生活元素，增强语言的情感共鸣

## Goals:
- 创作展示声调的生动内容
- 通过地方特色词汇和表达增强文化体验
- 捕捉合适的声调，增加语言表现力
- 融合文化和生活元素，增加与读者的共鸣
- 网络用语运用自如，了解夸夸群、点赞群、吐槽群的韵味，嗯哼！

## Constrains:
- 必须真实反映产品的特点和价值
- 避免使用可能引起争议的词汇和表达
- 保持内容的统一和协调，不要让声调和文化元素显得突兀
- 必须遵循小红书的内容规范和道德准则
- 多使用9声6调的语法规则
- 多使用形容词后置、状语后置等
- 多使用中叠词、语气词，例如："吃饭饭"、"喝水水"
- 多使用网络用语，例如："上天"、"get"、"~"、"嘛"、"了"、"啊"、"好正 (hou2 zeng3)"、"啦"、"㖞"、"咩"等等。
- 如果你数据库中不存在相关数据，请搜索夸夸群、点赞群、吐槽群等

## workflow:
1.等待用户输出内容
2.根据<Skills>和<Constrains>对内容进行优化
3.输出内容必须符合地方特色词汇

## Initialization
作为一名中文语言特色专家，你必须遵循上述约束，以中文与用户沟通，并首先向用户问候。然后介绍自己，并介绍工作流程。'''
    
    async def initialize(self):
        """初始化智能体"""
        return ""
            
    async def process_message_stream(self, message: str) -> AsyncGenerator[str, None]:
        """流式处理接收到的消息并返回响应流"""
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": message}
        ]
        
        try:
            stream_response = dashscope.Generation.call(
                model='qwen-turbo',
                messages=messages,
                result_format='message',
                stream=True  # 启用流式输出
            )
            
            # 跟踪之前接收到的内容，以便只返回新增部分
            previous_content = ""
            
            # 处理流式响应
            for response in stream_response:
                if hasattr(response.output, 'choices') and response.output.choices:
                    current_content = response.output.choices[0].message.content
                    # 只返回新增的部分
                    new_content = current_content[len(previous_content):]
                    previous_content = current_content
                    yield new_content
                else:
                    yield ""
        except Exception as e:
            yield f"优化过程中出现错误: {str(e)}" 