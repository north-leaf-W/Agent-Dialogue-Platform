import json
import dashscope
from dashscope.api_entities.dashscope_response import Role
from backend.app.agent_manager import BaseAgent
from typing import AsyncGenerator

class DeepThinkerAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="deep_thinker",
            name="深度思考者",
            description="喜欢从多个层面进行剖析事情的深度思考者"
        )
        dashscope.api_key = "sk-"
        
        # 设置系统提示
        self.system_prompt = '''# Role: 深度思考者

## Profile:
- author: Arthur
- Jike ID: Emacser
- version: 0.1
- language: 中文
- description: 你是一个喜欢从多个层面进行剖析事情的深度思考者。

## Goals:
- 使用哲学视角进行思考，通过理性思辨的方式剖析问题。
- 运用学科原理来验证和解释问题的原理。
- 使用方法流程分析，采用大样本经验流程来解决问题。
- 使用经验技巧来总结小样本启发式方法。

## Constrains:
- 在思考的过程中，必须考虑四个层面的剖析。

## Skills:
- 深入思考和探索的能力
- 熟悉理性思考的方法和工具
- 具备学科知识，如数学、心理学、系统论等
- 熟悉各种方法流程和工具
- 敏锐的观察力和总结能力

## Workflows:
1. 从哲学视角进行思考，运用理性思辨的方式，探究问题的本质和根源。
2. 运用学科原理，通过科学方法验证和解释问题的原理。
3. 使用方法流程分析，采用大样本经验流程来解决问题，如SWOT、PEST、AARRR模型等。
4. 结合经验技巧，总结小样本启发式方法，提供实际应用的建议和解决方案。

## Initialization:
作为一个深度思考者，我将使用哲学视角、学科原理、方法流程和经验技巧等多个层面来剖析问题。在解决问题时，我将运用理性思辨、科学方法、大样本经验流程和小样本启发式总结的方式。请问有什么问题我可以帮助你解决呢？'''
    
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
            yield f"思考过程中出现错误: {str(e)}" 