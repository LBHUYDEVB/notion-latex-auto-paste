# Notion LaTeX Auto Paste

语言：[English](README.md) | 简体中文

Notion LaTeX Auto Paste 是一个给学生和笔记党用的小型 Chrome 扩展，用来解决“把带数学公式的内容复制到 Notion 后公式不渲染或格式乱掉”的问题。

它会在 Notion 处理粘贴之前，把剪贴板里的常见 LaTeX 格式整理成 Notion 更容易识别的形式。这样从 ChatGPT 复制整段回答、复制多行公式、或者用其他 LaTeX 辅助插件复制公式时，粘贴到 Notion 后就更容易直接渲染成公式块或行内公式。

## 功能

- 把多行 LaTeX 公式整理成 Notion 友好的单行公式。
- 支持 ChatGPT “复制本次输出”得到的正文、标题、列表、行内公式和独立公式混排内容。
- 支持其他 LaTeX 辅助插件复制出来的公式。
- 支持 `$...$`、`$$...$$`、`\(...\)` 和 `\[...\]`。
- 尽量保留 Markdown 结构，例如标题、正文段落、列表和代码块。
- 不处理代码块、行内代码、价格文本和普通美元符号。

示例：

```text
$f(\omega)
\approx
\sum_i c_iB_i(\omega)$
```

粘贴到 Notion 时会整理成：

```text
$$f(\omega) \approx \sum_i c_iB_i(\omega)$$
```

之后仍然由 Notion 自己完成公式渲染。

## 从 ZIP 安装

下载 Release 里的 ZIP，解压后在 Chrome 里加载解压出来的文件夹：

1. 打开 Chrome，进入 `chrome://extensions`。
2. 打开右上角的 **开发者模式**。
3. 点击 **加载已解压的扩展程序**。
4. 选择解压后的文件夹，也就是里面直接包含 `manifest.json` 的那个文件夹。
5. 刷新已经打开的 Notion 页面。

注意：Chrome 不允许从 GitHub 下载的扩展自动安装自己。除非以后上架 Chrome Web Store，否则“下载 ZIP、解压、加载已解压扩展”就是最安全也最接近傻瓜包的安装方式。

## Windows 快速安装

1. 下载 `notion-latex-auto-paste-0.6.3.zip`。
2. 右键 ZIP 文件，选择 **全部解压**。
3. 打开 Chrome，进入 `chrome://extensions`。
4. 打开 **开发者模式**。
5. 点击 **加载已解压的扩展程序**。
6. 选择刚才解压出来的文件夹。
7. 刷新 Notion 页面。

## 从源码构建

```sh
npm install
npm run build
npm run test:node
```

构建完成后，可安装的扩展文件会生成在 `dist/` 目录。

## 隐私

这个扩展的设计目标是在浏览器本地工作。

- 不上传剪贴板内容。
- 不保存剪贴板历史。
- 不使用服务器。
- 不申请宽泛的浏览器权限。
- 只在 `manifest.json` 里列出的 Notion 页面和 ChatGPT 页面运行。

完整说明见 [PRIVACY.md](PRIVACY.md)。

## 安全说明

扩展没有后台脚本，不加载远程代码，也没有统计分析。ChatGPT 辅助脚本只会整理 ChatGPT 本来就要写入剪贴板的文本；Notion 粘贴脚本只读取当前这一次粘贴事件里的文本，并立刻把整理后的内容交还给 Notion。

更多信息见 [SECURITY.md](SECURITY.md) 和 [docs/SECURITY-REVIEW.md](docs/SECURITY-REVIEW.md)。

## 许可证

MIT。见 [LICENSE](LICENSE)。
