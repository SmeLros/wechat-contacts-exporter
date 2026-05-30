# WeChat Contacts Exporter

导出微信通讯录联系人（wxid、昵称、微信号、备注、签名）到 CSV。

## 依赖

此工具基于 [wechat-cli](https://github.com/huohuoer/wechat-cli)（`@canghe_ai/wechat-cli`），需要先安装并初始化。

## 安装

### 1. 安装 wechat-cli

安装及初始化指引见 [wechat-cli 文档](https://github.com/huohuoer/wechat-cli)，或直接：

```bash
npm install -g @canghe_ai/wechat-cli
```

### 2. 初始化（首次使用）

确保微信正在运行，然后：

```bash
# macOS/Linux: may need sudo for memory scanning
sudo wechat-cli init

# Windows: run in a terminal with sufficient privileges
wechat-cli init
```

这会自动检测微信数据目录、提取加密密钥。

**切换微信号后**，必须重新初始化：

```bash
wechat-cli init --force
```

### 3. 导出联系人

```bash
npm start
```

CSV 文件输出到 `output/` 目录（UTF-8 BOM 编码，Excel 可直接打开）。

## 字段说明

| 字段 | 来源 |
|------|------|
| wxid | 微信内部 ID（`wxid_*`） |
| nickname | 微信昵称 |
| wechat_id | 微信号（alias） |
| remark | 联系人备注 |
| description | 个人签名 |

## 原理

1. 遍历 `a-z` + `0-9` 调用 `wechat-cli contacts --query` 搜索联系人
2. 去重并过滤非 `wxid_` 开头的条目（仅保留个人微信联系人）
3. 并发查询 `wechat-cli contacts --detail` 获取完整信息
4. 导出为 UTF-8 BOM 的 CSV
