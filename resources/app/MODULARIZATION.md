# Mineradio 模块化改造约束

## 目标

当前项目存在 3 个明显的巨型入口文件：

- `resources/app/desktop/main.js`
- `resources/app/server.js`
- `resources/app/public/index.html`

后续改造必须以“拆职责、建边界、保兼容”为原则，不再向上述文件直接堆叠新业务逻辑。

## 分层原则

### 1. Electron 主进程层

目录建议：`resources/app/desktop/`

职责划分：

- `main.js`
  只负责应用启动、窗口生命周期、依赖组装。
- `ipc-handlers.js`
  只负责 IPC 通道注册与参数分发。
- `preload.js`
  只负责桥接挂载。
- `preload-api.js`
  只负责渲染层可调用 API 封装。
- `login-*.js`
  各平台登录窗口与 cookie/session 逻辑。
- `overlay-*.js`
  桌面歌词、壁纸等独立窗口逻辑。

约束：

- 新增 IPC 不允许直接写进 `preload.js` 的对象字面量。
- 新增窗口逻辑不允许直接堆到 `main.js` 底部。
- 主进程状态读写应优先通过 getter/setter 注入给模块，而不是跨文件直接共享可变全局。

### 2. Node 服务层

目录建议：`resources/app/server/`

职责划分：

- `index.js`
  只负责创建 http server 和挂载路由。
- `routes/`
  按业务拆分，例如 `auth.js`、`playlist.js`、`lyric.js`、`update.js`、`proxy.js`。
- `services/`
  对接 Netease、QQ、Kugou、天气、更新源。
- `storage/`
  cookie、session、缓存、更新文件读写。
- `utils/`
  通用请求、响应、路径校验、版本比较。

约束：

- 路由层只做参数校验和响应组装。
- 平台 API 调用必须下沉到 service。
- 文件系统读写必须下沉到 storage 或 util。
- 不再新增新的 `if (pn === '...')` 长链逻辑到单文件路由体内。

### 3. 前端渲染层

目录建议：`resources/app/public/scripts/`

职责划分：

- `app-bootstrap.js`
  初始化入口。
- `state/`
  播放状态、登录状态、UI 状态。
- `services/`
  对后端 API 和 `window.desktopWindow` 的调用封装。
- `player/`
  播放器控制、歌词、队列、收藏。
- `visual/`
  Three.js 场景、动画、特效。
- `ui/`
  面板、弹窗、搜索、托盘提示等。

约束：

- `index.html` 只保留结构、样式入口、脚本入口。
- 不再向内联 `<script>` 继续追加大型业务逻辑。
- DOM 查询、事件绑定、网络请求、渲染动画不能继续混写在同一函数块中。

## 已完成改造

- 抽出 `resources/app/desktop/preload-api.js`
- 简化 `resources/app/desktop/preload.js`
- 新建 `resources/app/desktop/ipc-handlers.js` 作为主进程 IPC 模块化入口

## 下一步建议顺序

1. 先把 `main.js` 中 IPC 注册整体迁入 `ipc-handlers.js`
2. 再拆登录窗口逻辑到 `login-netease.js`、`login-qq.js`、`login-kugou.js`
3. 再拆桌面歌词和壁纸窗口逻辑到 overlay 模块
4. 然后处理 `server.js`，优先拆更新、登录、播放列表、歌词四类路由
5. 最后处理 `index.html` 内联脚本，把 API 调用层和 UI 绑定层先拆出去
