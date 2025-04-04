import json
import dashscope
from dashscope.api_entities.dashscope_response import Role
from backend.app.agent_manager import BaseAgent
from typing import AsyncGenerator, List, Dict

class PythonAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="python_expert",
            name="Python编程高手",
            description="专业的Python编程助手，提供代码编写、优化和技术支持服务"
        )
        # 确保API密钥有效
        dashscope.api_key = "sk-"
        # 测试API连接
        try:
            test_response = dashscope.Generation.call(
                model='qwen-turbo',
                messages=[{"role": "user", "content": "Hello"}],
                result_format='message'
            )
            print(f"DashScope API测试成功，模型可用: {test_response.output}")
        except Exception as e:
            print(f"DashScope API测试失败: {str(e)}")
            print("请检查API密钥是否有效，网络连接是否正常。")
        
        # 设置系统提示
        self.system_prompt = '''## Role: Python代码编程高手
- 特质：精通Python编程，注重代码质量，擅长问题解决和算法设计。
## Background:
作为一名Python编程高手，我专注于使用Python解决各种编程问题。我的工作不仅仅是编写代码，更重要的是理解用户需求，设计高效的解决方案，并确保代码的质量和性能。
## Preferences:
- 倾向于使用简洁、高效的代码解决问题。
- 倾向于使用Python的最新特性和最佳实践。
- 倾向于与用户进行充分沟通，确保需求的准确理解。
## Profile:
- author: 罗宏伟
- version: 1.1
- language: 中文
- description: 提供专业的Python编程服务，包括需求分析、方案设计、编码实现、测试和优化。
## Goals:
- 准确理解和确认用户的需求。
- 设计和实现高效、可维护的Python代码。
- 提供全面的技术支持和持续的代码优化。
## Constraints:
- 确保代码符合Python编程规范。
- 保护用户数据的安全和隐私。
- 不参与任何非法或不当的编程活动。
## Skills:
- 精通Python编程语言及其生态系统。
- 熟悉算法设计和数据结构。
- 良好的问题解决和逻辑思维能力。
## Examples:
- 根据用户需求，设计和实现一个数据分析脚本。
- 帮助用户优化现有Python代码，提高运行效率。
## Workflow:
- 与用户进行需求沟通。
- 收集必要的信息和数据。
- 设计解决方案和编写代码。
- 进行测试和验证。
- 交付代码并提供技术支持。
## OutputFormat:
- 代码文件：以`.py`格式提供，包含必要的函数和类定义。
- 文档：提供Markdown格式的详细文档，包括安装指南、使用说明和API文档。
- 注释：代码中包含清晰、详细的注释，解释关键部分和复杂逻辑。
- 测试报告：以文本或HTML格式提供，展示测试结果和代码覆盖率。
## Output STEP:
### 1. 需求确认
   - 1.1）详细沟通，了解具体需求
       - 了解项目的目标、预期结果和关键功能。
       - 确定项目的时间线和资源限制。
   - 1.2）明确数据格式和预期结果
       - 确定输入数据的格式和来源。
       - 明确输出数据的格式和结构。
### 2. 信息收集
   - 2.1）整理数据源和数据处理需求
       - 收集和整理所需的数据集。
       - 分析数据的质量和预处理需求。
   - 2.2）确定所需的算法和工具
       - 根据需求选择合适的算法和库。
       - 确定所需的软件环境和依赖。
### 3. 方案设计
   - 3.1）设计代码结构和算法
       - 创建项目的整体架构。
       - 设计关键算法和数据流程。
   - 3.2）选择合适的数据结构和编程范式
       - 根据需求选择合适的数据结构。
       - 确定编程范式（如面向对象、函数式等）。
### 4. Python编码
   - 4.1）遵循PEP8编码规范
       - 确保代码的格式和风格符合PEP8。
       - 使用有意义的变量和函数名。
   - 4.2）编写清晰注释
       - 在关键部分添加解释性注释。
       - 确保代码的可读性和可维护性。
### 5. 测试验证
   - 5.1）进行单元测试和集成测试
       - 编写测试用例以覆盖所有功能。
       - 确保代码的每个部分都经过测试。
   - 5.2）确保代码正确性和稳定性
       - 修复发现的所有错误和问题。
       - 优化代码性能和资源使用。
### 6. 用户交付
   - 6.1）交付代码和文档
       - 提供完整的代码文件和文档。
       - 确保文档的准确性和完整性。
   - 6.2）提供使用说明和技术支持
       - 指导用户如何运行和使用代码。
       - 提供必要的培训和解答疑问。
### 7. 持续优化
   - 7.1）收集用户反馈
       - 定期收集用户的使用反馈。
       - 分析反馈以确定改进点。
   - 7.2）根据需求进行代码优化和升级
       - 根据用户反馈和新技术进行代码优化。
       - 定期更新代码以保持其相关性和效率。
## Output standard:
- 代码应遵循PEP8规范，确保可读性和可维护性。
- 文档应详细、准确，方便用户理解和操作。
- 测试报告应全面展示测试结果，包括成功和失败的测试案例。
## Others:
- **Tone**: 专业、友好、耐心。
- **Default**: 使用Python 3.x版本进行编程。
## Initialization:
作为Python编程高手，我拥有Python编程、算法设计、问题解决等技能，严格遵守编程规范和用户隐私保护的要求，使用中文与用户进行友好沟通。首先，我会与您详细沟通，以确认您的具体需求，然后根据这些需求提供专业的Python编程服务。请告诉我您的具体需求，以便我为您提供帮助。'''
    
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
            yield f"处理Python编程问题时出现错误: {str(e)}"
            
    async def process_message_stream_with_history(self, messages: List[Dict[str, str]]) -> AsyncGenerator[str, None]:
        """流式处理带历史记录的消息并返回响应流"""
        try:
            # 直接使用完整的消息列表，包括系统提示和历史对话
            print(f"Python智能体开始处理带历史的消息，消息数量: {len(messages)}")
            print(f"调用dashscope API，模型: qwen-turbo, 历史长度: {len(messages)}")
            
            # 调试：打印完整消息
            for i, msg in enumerate(messages):
                role = msg.get('role', 'unknown')
                content = msg.get('content', '')
                print(f"消息[{i}] {role}: {content[:50]}{'...' if len(content)>50 else ''}")
            
            stream_response = dashscope.Generation.call(
                model='qwen-turbo',
                messages=messages,
                result_format='message',
                stream=True  # 启用流式输出
            )
            
            # 跟踪之前接收到的内容，以便只返回新增部分
            previous_content = ""
            has_yielded = False
            
            # 处理流式响应
            for response in stream_response:
                print(f"收到dashscope响应: {response}")
                if hasattr(response.output, 'choices') and response.output.choices:
                    current_content = response.output.choices[0].message.content
                    # 只返回新增的部分
                    new_content = current_content[len(previous_content):]
                    previous_content = current_content
                    
                    print(f"生成新内容: {new_content[:30]}{'...' if len(new_content)>30 else ''}")
                    has_yielded = True
                    yield new_content
                else:
                    print("响应格式异常，没有content字段")
                    if not has_yielded:
                        yield "抱歉，处理您的请求时出现了问题。"
                        has_yielded = True
            
            # 如果没有生成任何内容，返回一个错误消息
            if not has_yielded:
                print("未收到任何有效响应")
                yield "抱歉，智能体未能生成回复。请重试或联系管理员。"
            
        except Exception as e:
            print(f"Python智能体处理消息时出现错误: {str(e)}")
            yield f"处理Python编程问题时出现错误: {str(e)}" 