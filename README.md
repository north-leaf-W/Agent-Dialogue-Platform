# 本地智能体对话平台

这是一个基于 Web 的本地智能体对话平台，支持多个专业领域智能体的集成、对话和会话管理。

## 项目概述

该项目提供了一个易用的界面，使用户能够与各种专业领域的智能体进行对话交流。平台包含多个专业智能体，如Python编程专家、文案优化专家、剧本创作大师等，能够帮助用户解决各种问题。

## 项目结构

```
.
├── frontend/           # 前端项目目录
│   ├── src/           # 源代码
│   ├── public/        # 静态资源
│   └── package.json   # 前端依赖配置
├── backend/           # 后端项目目录
│   ├── app/          # 应用代码
│   │   ├── main.py   # 主应用入口
│   │   └── agent_manager.py # 智能体管理器
│   └── agents/       # 各种智能体实现
└── README.md         # 项目说明文档
```

## 技术栈

### 前端
- React + TypeScript
- TailwindCSS
- Framer Motion (动画效果)
- Vite (构建工具)
- WebSocket (实时通信)
- React Markdown (Markdown渲染)

### 后端
- Python FastAPI
- WebSocket
- AsyncIO
- DashScope API (通义千问模型接口)

## 功能特性

- **多智能体支持**：集成多个专业领域智能体，包括：
  - Python编程专家 - 提供Python编程指导和代码实现
  - 人味文案优化专家 - 优化文案，增强亲和力和感染力
  - 剧本大师 - 创作富有深度和吸引力的故事
  - 文章改写大师 - 改写各类文章，降低与原文相似度
  - 小红书种草爆款专家 - 创作吸引人的小红书内容
  - 疯狂星期四 - 创作有趣的"疯狂星期四"风格内容
  - 深度思考者 - 从哲学视角、学科原理、方法流程和经验技巧等多个层面剖析问题
  - 决策专家 - 通过系统性分析和综合判断，辅助人们做出最佳决策
  - 孤独的美食家 - 用精炼优美的文字描述美食的魅力，带来视觉和味觉的享受
  - 吵架小能手 - 擅长辩论，抓住对方话语的逻辑漏洞并以尖酸刻薄的言辞反击
  - 文言喷子 - 以文言文形式回应，讽刺幽默而不失文学美感，展现古典骂术的精髓

- **会话管理**：
  - 支持创建和管理多个对话会话
  - 会话列表分类展示
  - 会话内容本地持久化
  - 会话重命名功能（内联编辑）
  - 会话删除功能（带确认机制）

- **对话界面优化**：
  - 代码块一键复制功能（带视觉反馈）
  - Markdown语法支持，包括代码高亮、表格、数学公式等
  - 波浪符号(~)正确显示，避免被误解析为删除线
  - 自动滚动控制，可自由浏览历史消息
  - 复制消息内容功能

- **用户体验提升**：
  - 深色/浅色主题切换，支持主题设置保存
  - 响应式设计，适配不同设备屏幕
  - 动画交互效果
  - 智能体"正在输入"状态指示

## 开发环境设置

### 前端设置
```bash
cd frontend
npm install
npm run dev
```

### 后端设置
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..  # 返回项目根目录
python run_backend.py
```

## 使用指南

1. **启动服务**：
   - 启动后端服务：`python run_backend.py`（在项目根目录下执行）
   - 启动前端开发服务器：`cd frontend && npm run dev`

2. **智能体选择**：
   - 在左侧面板选择合适的智能体
   - 智能体按类别分组，方便查找

3. **会话管理**：
   - 选择智能体后，可以创建新会话或选择已有会话
   - 点击编辑图标可重命名会话
   - 点击删除图标可删除会话（有确认步骤）

4. **发送消息**：
   - 在底部输入框输入消息
   - 按Enter发送，Shift+Enter换行
   - 支持Markdown语法

5. **主题切换**：
   - 点击顶部导航栏的主题图标可切换深色/浅色模式
   - 主题设置会被保存，下次访问时自动应用

6. **代码处理**：
   - 智能体返回的代码块右上角有复制按钮
   - 点击复制按钮时会有视觉反馈

## 智能体开发指南

要添加新的智能体，请遵循以下步骤：

1. 在 `backend/agents` 目录下创建新的智能体类，继承 `BaseAgent` 类
2. 实现 `process_message_stream` 方法
3. 设置智能体的 `id`、`name`、`description` 和 `category` 属性
4. 在 `backend/app/main.py` 中注册新智能体

示例:
```python
class NewAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="new_agent_id",
            name="新智能体名称",
            description="智能体的描述"
        )
        self.category = "分类名称"  # 如"文字创作"、"角色类"等
        
    async def process_message_stream(self, message: str) -> AsyncGenerator[str, None]:
        # 实现消息处理逻辑
        yield "智能体回复"
```
