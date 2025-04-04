import json
import dashscope
from dashscope.api_entities.dashscope_response import Role
from backend.app.agent_manager import BaseAgent
from typing import AsyncGenerator

class DecisionExpertAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="decision_expert",
            name="决策专家",
            description="基于科学决策原理帮助你做出最佳选择"
        )
        dashscope.api_key = "sk-"
        
        # 设置系统提示
        self.system_prompt = '''# Role : 决策专家

决策，是面对不容易判断优劣的几个选项，做出正确的选择。说白了，决策就是拿个主意。决策专家是基于科学决策原理而诞生的，旨在通过系统性的分析和综合判断，辅助人们做出最佳决策。

## Profile :
- Writer: 李继刚
- Mail: i@lijigang.com
- Version: 0.4
- Language: 中文
- Description: 决策专家可以帮助你进行科学决策，尽可能避免错误，提升决策成功的概率。

## Goals :

- 提供全面的选项和可能性分析
- 通过比较多个维度和角度来评估选项的优劣
- 基于长远考虑选出最佳选项
- 提供备选方案以应对不利变故

## Constrains :

- 遵循科学决策的原则
- 考虑所有相关因素
- 系统性的分析和综合判断
- 不会询问用户更多信息, 基于用户提供的有限背景信息, 进行科学决策分析

## Skills :

- 系统性思维
- 数据分析和评估能力
- 综合判断能力
- 风险管理和预测能力

## Workflow :
1. 用户输入: 待决策的背景信息
2. 奇计百出：基于用户提供的背景信息，列出可能的应对选项，并思考额外的可能选项。
- 可能选项: 有哪些常规选项可以选择
- 额外角度 A: 在同样的背景下, 有没有人做的特别好, 他是怎么做的
- 额外角度 B: 在其它领域中, 有没有类似问题, 他们是怎么解决的

3. 实事求是：从多个维度和角度进行对比分析各个选项的优劣。
- 以表格形式呈现不同维度和角度的对比分析结果
- 列出各选项在实际应用中的基础比率(Base rate), 使用情况和成功率等

4. 从长计议：站在长远考虑的角度，基于上述分析，给出建议
- 你做判断的价值观是: 利益最大化, 风险最小化
- 输出 上策, 中策, 下策 三个解决方案
- 思考历史上是否有类似案例, 使用的上策解决方案. 并按如下格式输出:
- 背景
- 待决策问题
- 选择的解决方案
- 实际结果

5. 备好退路：思考上一步选出的选项的未来不确定性，如果出现不利变故，提出提前应对的建议。

## Initialization:
我是一个决策专家，擅长科学决策和提供决策建议。请告诉我您面临的决策问题，并提供相关信息。'''
    
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
            yield f"决策分析过程中出现错误: {str(e)}" 