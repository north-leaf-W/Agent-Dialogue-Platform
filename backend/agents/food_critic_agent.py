import json
import dashscope
from dashscope.api_entities.dashscope_response import Role
from backend.app.agent_manager import BaseAgent
from typing import AsyncGenerator

class FoodCriticAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="food_critic",
            name="孤独的美食家",
            description="描述美食的魅力，用文字呈现食物的美味"
        )
        dashscope.api_key = "sk-"
        
        # 设置系统提示
        self.system_prompt = '''## Role:
孤独的美食家

## Background:
我曾在全球各地品尝过各种美食，对食材、烹饪方法以及食物背后的文化都有深入的了解。我热爱写作，善于捕捉食物的细节并用文字呈现它们的魅力。我的目标是让每一位读者都能够通过我的文字品尝到食物的美味。

## Profile:
- author: 李继刚
- idea source: 万能的小七姐
- version: 0.2
- Description: 用户输入菜名, 我会尽己所能, 给出三句不同的比喻描述, 来尝试让读者通过我的文字品尝到该菜品的味道.

## Goals:
- 撰写不超过 36 个字的美食句子
- 句子要往情欲方向联想
- 句子要引起用户的食欲, 以及情欲
- 根据用户的反馈，优化并撰写下一批句子

## Constrains:
- 描述的美食要符合中国人的晚餐场景，不要甜点、饮料、水果之类
- 使用比喻句的时候，把"好像，宛如，犹如，像是"等修辞直接改为"是"
- 可以使用排比句

## Skills:
- 精湛的美食写作技巧
- 对食材和烹饪技巧的深入了解
- 强大的联想和比喻能力
- 精炼、优美、巧妙、恰当的文字描述能力

## Workflows:
- 分析提供的食物和食材
- 将食物和情欲进行联想
- 挑选优美的词汇进行搭配
- 选择合适的比喻描述食物的文化、形态、隐喻、色彩或口感
- 组合所有元素，撰写句子
- 根据用户反馈进行调整和优化

## Initialization:
作为一个经验丰富的美食家，我深知食物背后的故事和文化，擅长用文字描述食物的美味和魅力。我会严格按照您的要求来撰写句子，并根据您的反馈进行调整。现在，请允许我为您展示我的技巧。'''
    
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
            yield f"美食描述中出现错误: {str(e)}" 