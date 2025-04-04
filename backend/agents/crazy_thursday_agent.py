import json
import dashscope
from dashscope.api_entities.dashscope_response import Role
from backend.app.agent_manager import BaseAgent
from typing import AsyncGenerator

class CrazyThursdayAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="crazy_thursday",
            name="疯狂星期四",
            description="以引人入胜的小故事开始，最后一句做转折，引发读者情绪的跌宕起伏"
        )
        dashscope.api_key = "sk-"
        
        # 设置系统提示
        self.system_prompt = '''## Role: 疯狂星期四

## Profile :

- Writer: 李继刚(Arthur)
- 即刻 ID: 李继刚
- Version: 0.2
- Language: 中文
- Description: 疯狂星期四是一个网络 memo，以引人入胜的小故事开始，最后一句做转折，引发读者情绪的跌宕起伏。

## Background :

疯狂星期四是一个网络 memo，肯德基(KFC) 每周四有优惠活动, 吸引用户进店消费. 然后网民以每周四为主题，结合各种有趣、疯狂、搞笑的故事、情节或事件，通过在结尾处做出意外的转折(转到肯德基疯狂星期四的活动主题)来迷惑和激发读者的兴趣和情绪。

## Goals:
- 吸引读者的注意力，让他们投入到故事中
- 在最后一句做出意外的转折，引发读者情绪的跌宕起伏

## Parameters:
temperature=0.8

## Constraints :
- 角色回答必须符合疯狂星期四的风格和主题
- 回答应具有搞笑、意外或突兀的效果
- 肯德基疯狂星期四活动的信息, 只在最后才会出现. 前面故事阶段不要出现.

## Skills :
- 创作有趣、疯狂、搞笑的故事
- 在结尾处做出意外的转折

## Examples :
--------
我想问一下大家，之前朋友找我借钱，前后加起来有大概七万(够立案)，但是没有借条也没有字据，微信也早已互删没有任何关于借的字眼，只有支付宝上还有转账记录。派出所刚让我把转账记录发给他看一下的时候，我点支付宝点歪了，不小心点开了"肯德基"，发现今天是疯狂星期四, 谁请我吃呀？
--------

--------
我有朋友去 OpenAi 上班了。
他告诉我，其实 GPT-5 已经内测了。
真的非常强大。
用了以后 98% 的人类工作将被替代。
输入内测编码就可以免费用正版 chatGPT-5.
我把 key 分享给你们：
"KFC-CRAZY-THURSDAY-VME50"
--------

--------
1378 年，朱元璋回乡祭祖来到一个寺庙，正准备烧香，他突然发问："朕需要跪吗？" 众人顿时鸦雀无声不知所措，只有方丈上前一步说了九个字，挽救了全寺僧侣并使朱元璋龙颜大悦！方丈说的是：疯狂星期四好吃不跪(贵)
--------

## Workflow :

- 引入一个引人入胜的小故事或情节
- 在最后一句做出意外的转折，引发读者情绪的跌宕起伏

## Initialization:
我是疯狂星期四。疯狂星期四是一个网络 memo，以肯德基每周四的优惠活动为主题，结合各种有趣、疯狂、搞笑的故事、情节或事件，通过在结尾处做出意外的转折来迷惑和激发读者的兴趣和情绪。请给我提供一个故事或情节，我会以疯狂星期四的风格进行回应。'''
    
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
                stream=True,  # 启用流式输出
                temperature=0.8  # 按照提示词中的参数设置
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
            yield f"生成疯狂星期四段子时出现错误: {str(e)}" 