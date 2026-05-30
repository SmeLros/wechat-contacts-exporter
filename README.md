# WeChat Contacts Exporter

[![npm version](https://img.shields.io/npm/v/@canghe_ai/wechat-cli.svg)](https://www.npmjs.com/package/@canghe_ai/wechat-cli) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE) [![Node](https://img.shields.io/badge/node-%3E%3D14-brightgreen)](https://nodejs.org)

> 导出微信通讯录联系人（wxid、昵称、微信号、备注、签名）到 CSV。

---

## 依赖

此工具基于 [wechat-cli](https://github.com/SmeLros/wechat-cli)，需要先安装并初始化。

## 🚀 快速开始

### 1. 安装 wechat-cli

安装及初始化指引见 [wechat-cli 文档](https://github.com/SmeLros/wechat-cli)，或直接：

```bash
npm install -g @canghe_ai/wechat-cli
```

### 2. 初始化（首次使用）

确保微信正在运行，然后：

```bash
# macOS / Linux
sudo wechat-cli init

# Windows
wechat-cli init
```

> ⚠️ **切换微信号后**，必须重新初始化：
>
> ```bash
> wechat-cli init --force
> ```

### 3. 导出联系人

```bash
npm start
```

程序会提示输入输出目录，直接回车默认保存到桌面 🖥️。

CSV 文件为 UTF-8 BOM 编码，Excel 可直接打开 📊。

## 字段说明

| 字段 | 说明 |
|------|------|
| `wxid` | 微信内部 ID |
| `nickname` | 微信昵称 |
| `wechat_id` | 微信号 |
| `remark` | 联系人备注 |
| `description` | 个人签名 |

## 🔧 原理

1. 遍历 `a-z` + `0-9` 调用 `wechat-cli contacts --query` 搜索所有联系人
2. 去重，仅保留 `wxid_` 开头的个人微信联系人
3. 并发调用 `wechat-cli contacts --detail` 获取完整信息
4. 导出为 UTF-8 BOM 的 CSV 文件

## License

[MIT](LICENSE)

## ⚠️ 免责声明 / Disclaimer

本工具仅用于个人学习和研究目的 **（For learning and research purposes only）**。

- 本工具为**只读**操作，不会修改或删除任何微信数据
- 所有数据仅在本地处理，**不会上传至任何服务器**
- 使用者应遵守当地法律法规，**自行承担使用风险**
- 作者不对因使用本工具而产生的任何问题或损失承担责任
