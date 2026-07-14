# 酷狗登录接口文档

## 二维码登录结果

接口地址：
`GET /raw-api/login/qr/check`

用途：
- 二维码扫码确认后返回登录态
- 前端首选从这里取头像和昵称

请求参数：
- `key`：二维码 key
- `platform`：当前用 `life`
- `timestamp`：时间戳

前端关注字段：
- `data.data.userid`
- `data.data.token`
- `data.data.nickname`
- `data.data.pic`
- `data.data.status`

成功示例：
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "data": {
      "nickname": "武子俊",
      "pic": "http://imge.kugou.com/kugouicon/165/20201127/20201127142356379978.jpg",
      "token": "62690307e2f2f8cf0dc749723c843f6f726367fbf367df3b2be8fdf6f39293ea",
      "userid": 1125705306,
      "status": 4
    },
    "error_code": 0,
    "status": 1
  },
  "meta": {}
}
```

字段映射：
- 名称：`nickname`
- 头像：`pic`

当前项目接入位置：
- 后端原始解析：`resources/app/server.js` 中 `normalizeKgQrCheck()`
- 前端扫码轮询：`resources/app/public/index.html` 中 `/api/kugou/login/qr/check`

## 登录态刷新 / 资料补同步

接口地址：
`GET /raw-api/login/token`

用途：
- 刷新 token
- 页面初始化后补同步头像和昵称
- 手动刷新 token 后再次同步用户资料

请求参数：
- `token`
- `userid`
- `platform`
- `timestamp`

前端关注字段：
- `data.data.userid` 或 `data.userid`
- `data.data.nickname` 或 `data.nickname`
- `data.data.pic` 或 `data.pic`

成功示例：
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "data": {
      "userid": 1125705306,
      "nickname": "武子俊",
      "pic": "http://imge.kugou.com/kugouicon/165/20201127/20201127142356379978.jpg"
    },
    "error_code": 0,
    "status": 1
  },
  "meta": {}
}
```

字段映射：
- 名称：`nickname`
- 头像：`pic`

当前项目接入位置：
- 后端资料补同步：`resources/app/server.js` 中 `kgQrToken()`
- 前端登录完成后保存会话：`resources/app/public/index.html` 中 `/api/kugou/login/qr/token`
- 前端初始化状态恢复：`resources/app/public/index.html` 中 `/api/kugou/login/status`

## 前端最终显示逻辑

显示优先级：
1. `nickname`
2. `username`
3. `userid`

头像优先级：
1. `pic`
2. `avatar`
3. 默认占位图

当前项目渲染位置：
- 顶部账号按钮：`resources/app/public/index.html` 中 `renderUserBtn()`
- 账号弹窗：`resources/app/public/index.html` 中 `updateUserModalUi()`
- 头像选择：`resources/app/public/index.html` 中 `providerAvatarSrc()`

## 当前项目封装说明

后端统一封装：
- `kgProfilePayload()`：抹平 `data.data` / `data` 两层结构
- `extractKgProfile()`：统一提取 `userid`、`nickname`、`pic/avatar`
- `normalizeKgQrCheck()`：处理扫码确认结果
- `kgQrToken()`：处理 token 刷新后的资料补同步

返回给前端的统一字段：
- `userId`
- `nickname`
- `avatar`
- `session`
- `loggedIn`
