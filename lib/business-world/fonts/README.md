# 报告中文字体

Noto Sans SC Regular，源自 Google Fonts 官方仓库的 Noto Sans SC。许可证见 OFL.txt。

- 来源提交：a85815a42757630ce188fdad368c2dfc444d4773
- 原文件：https://github.com/google/fonts/blob/a85815a42757630ce188fdad368c2dfc444d4773/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf
- 原文件 SHA256：a3041811a78c361b1de50f953c805e0244951c21c5bd412f7232ef0d899af0da
- 随仓库保存的静态实例：NotoSansSC-Regular.ttf，SHA256 94097dc47cd58f43fc78374c645a4dc37b777b0618496a9a9e2d27ab159547dc。

通过 fonttools 4.65.0 将 wght 固定到 400，使用 instantiateVariableFont(TTFont(source), {'wght': 400}, inplace=True, updateFontNames=True) 生成。静态字体保留中文字符覆盖，并避免运行时处理可变字重。没有使用许可证保留名 Source 作为派生字体名称。

PDF 使用 PDFKit 嵌入所需字形子集，经过实际渲染验证。PPTX 为可编辑文本，声明 Noto Sans SC；阅读软件可使用本地中文字体替代。
