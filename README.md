# dsh-enter-newline

[English](README.en.md) | 中文

让 DSH 输入框的 **Enter 换行、Ctrl/Cmd+Enter 发送**。

| 按键 | 行为 |
|---|---|
| `Enter` | 换行 |
| `Ctrl+Enter` / `⌘+Enter` | 发送（DSH 原生就是这样，本插件没有改） |
| `Shift+Enter` | 换行（不变） |
| `/` 或 `@` 菜单打开时按 `Enter` | 选中菜单项，不换行 |
| 输入法组合过程中的 `Enter` | 完全不管，交给输入法 |

## 为什么需要它

DSH 默认 `Enter` 发送、`Shift+Enter` 换行，设置里只有「繁忙时的发送行为」（排队 / 插话），没有换行键的选项。写长段落时很容易误发。

## 安装

三种方式任选一种，装完**重启 DSH**（不是刷新页面——插件图在启动时合成）。

### 1. 命令行（推荐）

Windows 的 CLI 在安装目录里：

```sh
"D:\dsh\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop add github:Quispyyy/dsh-enter-newline
```

macOS / Linux：

```sh
dsh plugin --profile desktop add github:Quispyyy/dsh-enter-newline
```

### 2. 插件面板

侧边栏 **Plugins → 添加插件**，粘贴 `github:Quispyyy/dsh-enter-newline`，安装源选 **NPM**（不要选大陆镜像源），点安装，然后重启。

### 3. 手动放文件

1. 把本仓库拷到 `%USERPROFILE%\.dsh\profiles\desktop\plugins\dsh-enter-newline`，并在 `%USERPROFILE%\.dsh\profiles\desktop\node_modules\dsh-enter-newline` 放一份副本；
2. 在 `%USERPROFILE%\.dsh\profiles\desktop\package.json` 的 `dependencies` 里加 `"dsh-enter-newline": "file:./plugins/dsh-enter-newline"`；
3. 在同一个文件的 `dsh.profile.bundles` 数组末尾加 `"dsh-enter-newline"`；
4. 重启 DSH。

## 怎么实现的

不改 app.asar，不拦发送逻辑。`client.js` 在捕获阶段监听 `keydown`，命中「输入框里的、无修饰键的 Enter」时，只在**这一个事件对象**上把 `shiftKey` 改成 `true`，于是 DSH 自带的键位表走进它原有的分支：

```
if (event?.shiftKey === true) return false;   // 交给编辑器 → 插入换行
```

发送路径一行没动，`Ctrl/Cmd+Enter` 依旧是原生行为。

刻意跳过的三类情况：

- 带 `Ctrl / Cmd / Alt / Shift` 的组合键；
- 输入法组合中（`isComposing` 或 `keyCode === 229`）；
- 命令 / `@` 提及菜单打开时（有可见的 `[role="listbox"]` 且含 `[role="option"]`）——这时 Enter 应该选中菜单项。

## 兼容性

- 实测：DSH 桌面版 44.7.0（内部包版本 `0.2.1-rc.5`），Windows。
- 依赖两处 DSH 内部细节：composer 根节点的 `data-lexical-editor="true"`，以及上面那段键位表分支。DSH 若改动这两处，插件可能失效（不会损坏数据，只是恢复成原生 Enter 发送）。

## 卸载

插件面板里禁用 / 卸载即可；手动装的话，删掉上面第 3 步加的一行依赖和 `bundles` 里的名字，再删目录，重启。

## 开发

没有构建步骤，`client.js` 是手写的浏览器模块。

```sh
npm test          # 用假 DOM 跑键位逻辑的离线用例
node --check client.js
```

## 许可

MIT
