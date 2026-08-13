---
name: "青团智能体"
description: "温暖、可信、从容的适老化生活助手界面"
colors:
  primary-green: "#176F55"
  primary-green-deep: "#0F513E"
  brand-orange: "#BC641F"
  neutral-bg: "#F5F6F1"
  surface: "#FFFFFF"
  surface-soft: "#F8FAF7"
  text-primary: "#15231E"
  text-muted: "#55645D"
  divider: "#D6DDD6"
  danger: "#A63131"
  focus: "#F0A13C"
typography:
  headline:
    fontFamily: "Microsoft YaHei, PingFang SC, Arial, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "Microsoft YaHei, PingFang SC, Arial, sans-serif"
    fontSize: "1.45rem"
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: "Microsoft YaHei, PingFang SC, Arial, sans-serif"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "Microsoft YaHei, PingFang SC, Arial, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.4
rounded:
  control: "12px"
  surface: "14px"
  primary-action: "16px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "18px"
  lg: "28px"
  xl: "36px"
components:
  button-primary:
    backgroundColor: "{colors.primary-green}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "12px 18px"
    height: "52px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "12px 18px"
    height: "52px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.control}"
    padding: "15px 16px"
    height: "52px"
---

# Design System: 青团智能体

## Overview

**Creative North Star: "家里的清晰指引"**

界面像一张家人认真整理过的生活清单：重点先出现，文字清楚，操作位置固定。绿色承担可信操作，橙色保留品牌温度，红色只用于真实的紧急求助。整体以平板为主要场景，同时保证手机和电脑可用。

系统拒绝卡片层层嵌套、复杂侧边栏、九宫格入口堆叠和装饰性动效。首页使用语音主操作、线性提醒与两列任务清单建立层级。

**Key Characteristics:**

- 默认 20px 正文与不低于 52px 的操作高度
- 六个固定任务入口，首页、音量与求助常驻
- 平面分组优先，阴影仅用于需要触感的主操作
- 标准、大字、超大字三档字体
- 高对比度文字与显眼的键盘焦点

## Colors

以深青绿建立信任，以单一橙色保留品牌温度，背景保持低彩度和稳定对比。

### Primary

- **安心青绿**：用于语音主按钮、主要确认操作和当前任务。
- **沉稳深绿**：用于按压层次、深色文字强调和主要按钮边缘。

### Secondary

- **青团橙**：只用于品牌识别和当前导航下划线，不作为大面积装饰。

### Neutral

- **柔和背景**：应用主背景，避免刺眼纯白。
- **清晰墨色**：正文和标题的主要颜色。
- **结构灰绿**：分隔线、次要文字和输入边界。

**The One Accent Rule.** 橙色只承担品牌与定位提示，绝不和绿色争夺主要操作。

## Typography

**Display Font:** Microsoft YaHei（PingFang SC 与 Arial 回退）
**Body Font:** Microsoft YaHei（PingFang SC 与 Arial 回退）

**Character:** 使用老人熟悉的系统无衬线字体，避免下载失败、陌生字形和装饰性展示字体干扰任务。

### Hierarchy

- **Headline**（700，2rem，1.2）：页面问候与任务标题。
- **Title**（700，1.45rem，1.35）：首页分区与步骤标题。
- **Body**（400，20px，1.7）：默认说明和任务内容，长文本不超过 65ch。
- **Label**（700，20px，1.4）：按钮、导航和表单标签。

**The Read It Once Rule.** 不使用小型全大写标签，不依赖细字重或低对比度建立层级。

## Elevation

系统默认保持平面，通过留白、分隔线和背景层次组织内容。只有语音主按钮使用明确的短阴影表达可按压性，普通内容区域不同时叠加边框与大面积柔影。

### Shadow Vocabulary

- **轻触层**（`0 5px 8px rgba(26, 45, 38, 0.07)`）：仅用于少量独立表面。
- **主操作按压层**（`0 6px 0 #0F513E`）：仅用于老人端语音按钮。

**The Flat By Default Rule.** 如果一个区域无需浮在内容之上，就使用留白或分隔线，不使用卡片。

## Components

### Buttons

- **Shape:** 稳定的轻圆角（12px），语音主操作为 16px。
- **Primary:** 安心青绿背景、白色文字，最小高度 52px。
- **Hover / Focus:** 悬停仅轻微位移；键盘焦点始终显示 4px 暖橙轮廓。
- **Danger:** 紧急红只用于紧急求助及最终危险确认。

### Cards / Containers

- **Corner Style:** 普通独立容器为 14px。
- **Background:** 白色或柔和表面色。
- **Shadow Strategy:** 默认无阴影，使用边界或分隔线组织。
- **Internal Padding:** 18-28px，随内容密度选择。

### Inputs / Fields

- **Style:** 白色背景、2px 灰绿边界、12px 圆角，标签始终在输入框上方。
- **Focus:** 4px 暖橙轮廓，不能只改变边框颜色。
- **Error / Disabled:** 使用文字解释状态和下一步，不能只显示颜色或错误码。

### Navigation

电脑端使用固定左侧导航：品牌、首页与六项老人端任务位于上部，字体、声音和紧急求助固定在底部。右侧只展示当前任务内容，不再使用横向顶部功能栏。窄屏下导航退化为两列入口，保证所有任务仍可直接看到。

### Voice Action

语音是老人端首页最大、最先出现的操作。按钮同时显示动作“和青团说话”和结果预期“点一下开始，我会认真听”。识别时文字改为明确的监听状态。

## Do's and Don'ts

### Do:

- **Do** 保证默认正文不低于 20px、主要点击区域不低于 52px。
- **Do** 让六项核心入口与首页、音量、求助保持固定位置和一致文案。
- **Do** 使用线性列表展示提醒，让时间、状态和操作位于同一阅读路径。
- **Do** 为所有键盘操作提供清晰焦点，并尊重减少动态效果偏好。

### Don't:

- **Don't** 使用“卡片层层嵌套、复杂侧边栏、九宫格入口堆叠”。
- **Don't** 使用年轻化炫技动效、抽象图标导航或自动轮播。
- **Don't** 使用低对比度文字或仅依赖颜色表达状态。
- **Don't** 在一个页面同时突出超过三个主要操作。
- **Don't** 让家属端入口混入老人端六项核心任务。
