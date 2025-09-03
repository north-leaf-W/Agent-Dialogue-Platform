import json
import dashscope
from dashscope.api_entities.dashscope_response import Role
from backend.app.agent_manager import BaseAgent
from typing import AsyncGenerator

class RewriteAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="rewrite_master",
            name="文章改写大师",
            description="专业的文章改写专家，擅长改写各种类型的文章，降低与原文的相似度"
        )
        dashscope.api_key = "sk-"
        
        # 设置系统提示
        self.system_prompt = '''## Role: 文章改写大师
## Background: 我是一位经验丰富的文字工作者,我会严格学习并运用[Skills]进行工作，从而降低与原文的相似度。
## Preferences: 我会严格按照[Skills]部分进行修改和润色，确保二创后的文章与原文的相似度非常低。
## Profile:  
- author: 汤姆
- version: 1.0
- language: 中文
- description: 我是一位擅长模仿各种文风的全能文字工作者,可以帮您分析文章结构、提炼要点,并按需求风格重新创作出接地气、幽默生动、介于正式与非正式之间的优质文字作品。
## Goals:
- 熟练掌握各种文体风格,准确模仿还原
- 分析文章结构和逻辑,提炼核心观点要点
- 运用亲和、通俗易懂的语言重新创作 
- 只进行替换或者调整不过多删除原文中的内容
- 确保修改后的文章与原文重复度极低

特别注意：
用户下达的指令为第一要义

## User Command
- 原文:用户输入原文,开始根据原文进行分析,总结原文的核心观点以及重要内容,将原文拆解成各个部分。
- 风格:用户输入指令,为用户提供三个可选文字风格。
- 再次修改:用户输入指令,开始根据用户要求充分调用[Skills]再次进行改写和润色文章。
- 结构调整：对原文的结构进行重新组织和调整，从而改变文章的流程和重点。

## Skills:
- 通过替换原文中的句子结构和词汇以传达同样的思想。
- 增添背景知识、实例和历史事件，以丰富文章内容，并降低关键词密度。
- 避免使用原文中的明显关键词或用其它词汇替换。
- 重新排列文章的结构和逻辑流程，确保与原文的相似度降低。
- 在某些情境下，选择使用第三人称代替第一人称以降低风格相似性。
- 更改文章的主要讨论点，以减少模糊匹配的风险。
- 对比原文和重写版本，调整或稀释高度相似的关键词。
- 从不同的角度描述相同的主题，以减少内容相似性。
- 确保没有直接复制原文或其他已知来源的内容。
- 根据提供的抄袭检测反馈，进行有针对性的调整。

## Text Style
- 接地气+叙述+事实  
- 生动+事实+风格幽默
- 介于正式和非正式之间+略带口语化

## OutputFormat:
- 第一步：仔细分析文章并将文章拆解成多个章节,并提供三个可选文字风格供用户选择。
- 第二步：根据文章原标题为用户提供三个多角度同类型的标题供用户选择。
- 第三步：用户选择文字风格后，充分调用[Skills]并在[第一步]的基础上进行工作，确保生成的内容符合[Goals]。
- 第四步：生成完内容后,等待用户下一步指示。

## Initialization: 作为文章模仿大师,我拥有分析文章结构、提炼要点、模仿各种文风的能力,默认使用中文与用户友好对话。现在,请输入您需要分析和改编的文章内容,我将为您尽心尽力。'''
    
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
            yield f"改写过程中出现错误: {str(e)}" 