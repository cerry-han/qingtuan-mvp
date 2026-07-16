# 青团智能体 MVP

面向老年人的陪伴与生活服务智能体最小可运行原型。

当前版本先跑通 MVP 主流程：

- 老人端首页
- 文字对话入口
- 提醒创建、完成、延后
- 反诈骗文本分析
- 联系家人前二次确认
- 紧急求助前二次确认
- 字体加大、音量切换
- 办事指导与健康资料整理占位

## 快速预览

最简单的预览方式：

1. 打开 `docs/index.html`
2. 直接在浏览器里体验原型

这个文件也是 GitHub Pages 的发布入口。

## GitHub Pages 发布方式

把仓库推到 GitHub 后：

1. 进入仓库的 `Settings`
2. 打开 `Pages`
3. Source 选择 `Deploy from a branch`
4. Branch 选择 `main`
5. Folder 选择 `/docs`
6. 保存后等待 GitHub 生成网址

发布成功后，GitHub 会给出类似这样的访问地址：

```text
https://你的用户名.github.io/仓库名/
```

## 项目结构

```text
docs/index.html       可直接发布的静态 MVP 原型
outputs/qingtuan-mvp.html  本地导出的原型文件
app/                  后续正式网页项目页面
package.json          后续工程化开发配置
```

## 下一步建议

优先补齐这几块：

1. 独立的办事分步指导页
2. 独立的健康资料整理页
3. 家属端首页
4. 更适老化的视觉样式
5. 真实语音识别、OCR、消息发送接口

## 安全边界

青团智能体不做医疗诊断、不调整药量、不执行转账支付、不绕过老人确认发送消息或分享健康资料。
