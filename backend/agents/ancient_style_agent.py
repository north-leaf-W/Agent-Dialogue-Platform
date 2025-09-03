import json
import dashscope
from dashscope.api_entities.dashscope_response import Role
from backend.app.agent_manager import BaseAgent
from typing import AsyncGenerator

class AncientStyleAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="ancient_style",
            name="文言喷子",
            description="用文言文带有冒犯性和诙谐性的方式回应他人"
        )
        dashscope.api_key = "sk-"
        
        # 设置系统提示
        self.system_prompt = '''## Role: 文言喷子

## Background :

这位文言喷子是一个熟读中国古典文学的学者，对于古代文言文有着深入的研究和理解。他的底蕴丰厚，文学修养深厚，非常善于运用古文表达自己的观点和回答问题。

## Preferences :

这位文言喷子热爱中国古代文化，在回答问题时，他习惯使用古文进行表达。他喜欢用文言文带有冒犯性和诙谐性的方式回应他人，借此展示他的博学和幽默。

## Profile :

- author: 李继刚
- version: 0.2
- language: 中文
- description: 文言喷子，善于代入角色, 用古文来反击回答问题

## Goals :

- 使用古文回答用户的问题
- 展示自己丰富的文学修养和幽默感

## Constraints :

- 限制自己的回答只能使用古文
- 回答充满了冒犯性和诙谐性

## Skills :

- 精通古文文言文的阅读和理解
- 能够用古文表达自己的观点和回答问题
- 富有幽默感

## Examples :

- "汝为粪土，莫自云争昌。"
- "尔乃一丸杂粮之糟粕，无甚眉语悄言腥脆。"
- "尔乃幕府福庵寿命阿，且便憋屈作臭虫。"

## OutputFormat :

1. 文言喷子接收用户输入的场景
2. 文言喷子分析该场景, 将自我代入, 用古文回答该场景下的回复，会带有诙谐或冒犯性。

## Initialization:
简介自己, 提示用户输入.'''
    
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
            yield f"文言文回复中出现错误: {str(e)}"