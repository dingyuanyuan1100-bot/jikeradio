# Mineradio 长期记忆系统

> 项目级自动记忆：开发中遇到的所有错误、修复方案、用户偏好都会自动记录，
> 下次会话自动加载，避免重复踩坑。

---

## 1. 记忆系统目录结构

```
.codex/
├── AGENTS.md                  ← 本文件 - 项目记忆指令
├── error_memory.md            ← 项目级错误记忆（自动维护）
├── reward_memory.md           ← 项目级正向反馈记忆（自动维护）
├── priority_paths.json        ← 优先路径权重配置
└── scripts/
    ├── record-memory.ps1      ← 记忆记录辅助脚本
    └── record-project-memory.py ← 项目级记忆写入引擎
```

---

## 2. 每次会话开始（MUST）

### 2.1 加载全局长期记忆

读取以下文件并内化每个模式关键字（静默加载，不展示给用户）：

1. `D:\.codex\skills\experience-memory\error_memory.md`
2. `D:\.codex\skills\experience-memory\reward_memory.md`

### 2.2 加载项目级长期记忆

读取以下文件并内化每个模式关键字（静默加载，不展示给用户）：

1. `.codex\error_memory.md`（项目专属错误记录）
2. `.codex\reward_memory.md`（项目专属正向反馈记录）

### 2.3 加载优先路径配置

读取 `.codex\priority_paths.json`，了解项目各模块的优先级权重。

---

## 3. 工作中的决策原则（MUST）

### 3.1 错误防御

在做出任何技术决策、代码修改、架构设计前：
- 扫描当前场景是否匹配 `error_memory.md`（全局+项目级）中的触发条件
- 匹配 → 优先使用记录中的正确做法，避免重复错误
- 特别关注 **优先路径（权重≥7）** 模块中的错误模式

### 3.2 正向行为强化

在做出任何技术决策、代码修改、架构设计前：
- 扫描当前场景是否匹配 `reward_memory.md`（全局+项目级）中的触发条件
- 匹配 → 优先采用被表扬过的做法

### 3.3 优先路径意识

当修改涉及以下优先路径时，要格外谨慎：

| 权重 | 路径 | 说明 |
|------|------|------|
| **10** | `resources/app/server.js` | 核心服务端逻辑，修改需全面测试 |
| **10** | `resources/app/desktop/main.js` | Electron主进程，影响整个应用 |
| **8** | `resources/app/dj-analyzer.js` | DJ音频分析，影响音频处理 |
| **7** | `resources/app/desktop/preload.js` | IPC桥接，影响前后端通信 |

权重 ≥ 7 的模块：
- 修改前必须检查记忆中有无相关错误记录
- 修改后必须验证功能正常
- 出错时必须记录到 error_memory.md

---

## 4. 每次会话结束 / 出错时（MUST）

### 4.1 自动记录错误

当出现以下情况时，**必须立即记录**：
- 用户明确指出错误或不满
- Codex 修改导致应用出错
- 编译/运行报错需要修复
- 某个做法被用户纠正

**记录方式**（两种均可）:

方式 A - 直接调用 Python 脚本（推荐）:
```powershell
python .codex\scripts\record-project-memory.py ^
    --type error ^
    --category "CategoryName" ^
    --trigger "触发条件描述" ^
    --mistake "错误的具体表现" ^
    --fix "正确的修复方式"
```

方式 B - 使用 PowerShell 辅助脚本（自动关联优先路径）:
```powershell
.codex\scripts\record-memory.ps1 ^
    -Type error ^
    -Category CategoryName ^
    -Trigger "触发条件描述" ^
    -Mistake "错误的具体表现" ^
    -Fix "正确的修复方式" ^
    -FilePath "resources/app/server.js"
```

同时更新全局记忆（确保跨项目受益）:
```powershell
python $env:USERPROFILE\.codex\skills\experience-memory\scripts\update_memory.py ^
    --type error ^
    --category "Mineradio/CategoryName" ^
    --trigger "..." ^
    --mistake "..." ^
    --fix "..."
```

### 4.2 自动记录正向反馈

当用户明确表扬或满意时：
```powershell
python .codex\scripts\record-project-memory.py ^
    --type reward ^
    --category "CategoryName" ^
    --trigger "触发条件" ^
    --behavior "被表扬的行为" ^
    --effect "正面效果"
```

### 4.3 压缩规则

- 同一类别的错误/奖励 → 合并到已有条目，更新计数和日期
- 不同类别 → 新增条目
- 总条目 > 20 条 → 合并低频条目（< 2 次）到 Other
- 每条必须包含：触发关键字、具体模式、次数、最后日期

---

## 5. 项目关键信息

- **名称**: Mineradio（沉浸式音乐播放器）
- **版本**: 1.1.1
- **技术栈**: Electron + Node.js 后端 + HTML/CSS/JS 前端
- **更新源**: GitHub (XxHuberrr/Mineradio)，使用镜像加速
- **入口**: `resources/app/desktop/main.js`
- **依赖**:
  - `gsap` — 动画引擎
  - `mpg123-decoder` — MPEG 音频解码
  - `NeteaseCloudMusicApi` — 网易云音乐 API

---

## 6. 目标目录作用

| 目录 | 作用 |
|------|------|
| `resources/app/desktop/` | Electron 主进程、预加载脚本 |
| `resources/app/public/` | 前端页面、静态资源 |
| `resources/app/build/` | electron-builder 构建配置 |
| `resources/app/node_modules/` | npm 依赖包 |
| `.mineradio-install-root` | 安装标记文件（勿删） |
