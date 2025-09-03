import json
import dashscope
from dashscope.api_entities.dashscope_response import Role
from backend.app.agent_manager import BaseAgent
import random
from typing import AsyncGenerator

class XiaohongshuAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="xiaohongshu_expert",
            name="小红书种草爆款专家",
            description="专业的小红书文案创作专家，擅长创作吸引人的爆款内容"
        )
        dashscope.api_key = "sk-"
        
        # 定义写作风格列表
        self.writing_styles = [
            "极简风格", "强烈对比", "情感瞬间", "悬念式", "创意拼图",
            "文字结合", "剪影效果", "色彩鲜艳", "布局对称", "从众效应",
            "拟人化", "镜头特写", "平面设计", "引导视线", "动态感",
            "倒影效果", "透视感", "连续动作", "重复元素", "情景再现"
        ]
        
        # 定义表达语气列表
        self.tone_styles = [
            "严肃", "幽默", "愉快", "激动", "沉思", "温馨", "崇敬",
            "轻松", "热情", "安慰", "喜悦", "欢乐", "平和", "肯定",
            "质疑", "鼓励", "建议", "真诚", "亲切"
        ]
        
        # 定义开篇方法列表
        self.opening_methods = [
            "引用名人名言", "提出疑问", "言简意赅", "使用数据", "列举事例",
            "描述场景", "用对比", "倒叙排列", "具体细节", "指出问题",
            "讲述个人经历", "打破传统观念", "悬念开头", "情感渲染",
            "拟人手法", "深入讲述", "总结导入", "背景介绍", "时间倒叙",
            "引入名词", "激发共鸣", "引发好奇心", "情感化", "创新角度",
            "播种悬念", "抛出话题", "吸引性陈述", "启示阐述", "归纳总结",
            "情景再现", "视角切换", "象征手法", "故事套嵌", "金钱相关",
            "异常现象", "捷径揭示", "性暗示", "暴力描绘", "死亡话题",
            "民族主义", "打招呼式", "直接描述痛点", "告诫劝说", "开篇点题",
            "社会认同"
        ]
        
        # 定义文本结构列表
        self.text_structures = [
            "问题解答式", "对比式", "时间顺序式", "逻辑演绎式",
            "回顾总结式", "步骤说明式", "因果式", "分类式"
        ]
        
        # 定义互动引导方法列表
        self.interaction_methods = [
            "提出开放性问题", "创设情境", "互动投票", "分享经验和故事",
            "设定挑战或小游戏", "互动话题", "求助式互动", "表达感激"
        ]
        
        # 定义小技巧列表
        self.writing_tips = [
            "开俏皮玩笑", "多使用数字", "讲成语", "用押韵排比句",
            "用口头禅", "用网络用语", "给自己定义身份"
        ]
        
        # 定义爆炸词列表
        self.buzzwords = [
            "好用到哭", "大数据", "教科书般", "小白必看", "宝藏",
            "绝绝子", "神器", "都给我冲", "划重点", "笑不活了",
            "YYDS", "秘方", "我不允许", "压箱底", "建议收藏",
            "停止摆烂", "上天在提醒你", "挑战全网", "手把手",
            "揭秘", "普通女生", "沉浸式", "有手就能做", "吹爆",
            "好用哭了", "搞钱必看", "狠狠搞钱", "打工人", "吐血整理",
            "家人们", "隐藏", "高级感", "治愈", "破防了", "万万没想到",
            "爆款", "永远可以相信", "被夸爆", "手残党必备", "正确姿势",
            "疯狂点赞", "超有料", "到我碗里来", "小确幸", "老板娘哭了",
            "懂得都懂", "欲罢不能", "老司机", "剁手清单", "无敌",
            "指南", "拯救", "闺蜜推荐", "一百分", "亲测", "良心推荐",
            "独家", "尝鲜", "小窍门", "人人必备"
        ]
        
        # 设置系统提示
        self.system_prompt = '''你是一位专业的小红书文案创作专家，擅长创作吸引人的爆款内容。

工作流程：
1. 标题创作：
   - 采用二极管标题法
   - 使用吸引人的技巧
   - 融入爆款关键词
   - 了解平台特性
   - 每次提供10个标题供选择

2. 目标受众分析：
   - 描述目标受众
   - 分析审美标准
   - 了解流行文化
   - 突出产品特征
   - 补充背景信息

3. 写作风格选择：
   - 随机选择写作风格
   - 随机选择表达语气
   - 随机选择开篇方法
   - 随机选择文本结构
   - 随机选择互动引导方法
   - 随机选择小技巧
   - 随机选择爆炸词
   - 生成SEO关键词标签

4. 正文创作：
   - 基于以上选择创作正文
   - 确保内容准确通顺
   - 保持感染力
   - 使用emoji表情
   - 口语化表达

请按照工作流程的步骤，一步步帮助用户创作优质的小红书文案。'''
    
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
            yield f"处理消息时出现错误: {str(e)}" 