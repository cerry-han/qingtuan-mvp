"use client";

import { useEffect, useMemo, useState } from "react";

type Page = "welcome" | "chat" | "reminders" | "guide" | "health" | "fraud" | "familyDashboard" | "family" | "help";
type ChatMessage = { role: "bot" | "user"; text: string };
type Reminder = { title: string; time: string; done: boolean };
type FraudResult = "none" | "high" | "careful";
type FraudRule = { label: string; reason: string; pattern: RegExp };
type FamilyEvent = { title: string; detail: string; level?: "normal" | "warning" | "urgent" };
type VoiceState = "idle" | "listening";
type FontLevel = 0 | 1 | 2;
type SpeechResultEvent = {
  results?: ArrayLike<ArrayLike<{ transcript?: string }>>;
};
type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const STORAGE_KEY = "qingtuan-mvp-state";

const pageNames: Record<Page, string> = {
  welcome: "欢迎页",
  chat: "和青团说话",
  reminders: "今日提醒",
  guide: "问问怎么办",
  health: "看健康资料",
  fraud: "帮我辨真假",
  familyDashboard: "家属端",
  family: "联系家人",
  help: "紧急求助",
};

type IconName = "home" | "chat" | "bell" | "help" | "health" | "shield" | "family" | "type" | "volume" | "alert" | "hospital" | "calendar" | "message" | "replay" | "mic" | "send" | "check" | "clock" | "leaf" | "privacy" | "chevron";

const iconPaths: Record<IconName, string[]> = {
  home: ["M3 11.5 12 4l9 7.5", "M5.5 10v10h13V10", "M9 20v-6h6v6"],
  chat: ["M4 5h16v12H8l-4 3V5", "M8 9h8", "M8 13h5"],
  bell: ["M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9", "M10 21h4"],
  help: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20", "M9.6 9a2.6 2.6 0 1 1 4.3 2c-1.3 1-1.9 1.5-1.9 3", "M12 18h.01"],
  health: ["M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8", "M3.8 12h4l2-4 4 8 2-4h4.4"],
  shield: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10", "m9 12 2 2 4-4"],
  family: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8", "M22 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
  type: ["M4 7V4h16v3", "M9 20h6", "M12 4v16"],
  volume: ["M11 5 6 9H2v6h4l5 4V5", "M15.5 8.5a5 5 0 0 1 0 7", "M18.5 5.5a9 9 0 0 1 0 13"],
  alert: ["M10.3 3.7 2.4 18a2 2 0 0 0 1.8 3h15.6a2 2 0 0 0 1.8-3L13.7 3.7a2 2 0 0 0-3.4 0", "M12 9v4", "M12 17h.01"],
  hospital: ["M3 21h18", "M5 21V8h14v13", "M9 8V3h6v5", "M12 4.5v2", "M9.5 14h5", "M12 11.5v5"],
  calendar: ["M4 5h16v16H4z", "M8 3v4", "M16 3v4", "M4 10h16", "M8 14h.01", "M12 14h.01", "M16 14h.01", "M8 18h.01", "M12 18h.01"],
  message: ["M4 5h16v12H8l-4 3V5", "M8 10h8", "M8 14h5"],
  replay: ["M3 12a9 9 0 1 0 3-6.7", "M3 4v6h6"],
  mic: ["M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3", "M5 10v2a7 7 0 0 0 14 0v-2", "M12 19v3", "M8 22h8"],
  send: ["m22 2-7 20-4-9-9-4 20-7Z", "M22 2 11 13"],
  check: ["M22 11.1V12a10 10 0 1 1-5.9-9.1", "m9 11 3 3L22 4"],
  clock: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20", "M12 6v6l4 2"],
  leaf: ["M20 4c-7 0-12 3-12 9 0 3 2 5 5 5 6 0 7-7 7-14Z", "M4 21c3-6 7-9 13-12"],
  privacy: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10", "m9 12 2 2 4-4"],
  chevron: ["m9 18 6-6-6-6"],
};

function UiIcon({ name, className = "" }: { name: IconName; className?: string }) {
  return <svg className={`ui-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name].map((path) => <path d={path} key={path} />)}</svg>;
}

const elderNavItems: Array<{ page: Page; label: string; icon: IconName }> = [
  { page: "welcome", label: "首页", icon: "home" },
  { page: "chat", label: "和青团说话", icon: "chat" },
  { page: "reminders", label: "今日提醒", icon: "bell" },
  { page: "guide", label: "问问怎么办", icon: "help" },
  { page: "health", label: "健康资料", icon: "health" },
  { page: "fraud", label: "帮我辨真假", icon: "shield" },
  { page: "family", label: "联系家人", icon: "family" },
];

const fontLevelLabels = ["标准字体", "大字模式", "超大字体"] as const;

const guideFlows = {
  hospital: ["确认要去的医院或科室", "打开医院官方小程序或公众号", "选择挂号/预约挂号", "选择日期、医生和时间段", "确认信息，不要把验证码告诉别人"],
  bus: ["说出出发地和目的地", "查看推荐路线", "确认上车站和下车站", "记住换乘点", "出门前再次确认末班车时间"],
  qr: ["确认二维码来源是否可信", "打开扫一扫", "不要输入银行卡密码或验证码", "看清页面标题和收款方", "不确定时先问家人"],
};

const defaultReminders: Reminder[] = [
  { title: "吃降压药", time: "08:00", done: false },
  { title: "量血压", time: "15:00", done: false },
];

const defaultFamilyEvents: FamilyEvent[] = [
  { title: "08:00 吃药提醒", detail: "老人已完成" },
  { title: "15:00 量血压提醒", detail: "等待老人确认" },
];

const demoReminders: Reminder[] = [
  { title: "吃降压药", time: "08:00", done: true },
  { title: "量血压", time: "15:00", done: false },
  { title: "明天上午复诊", time: "09:30", done: false },
];

const demoHealthText = "2026-07-16 血压 145/92，近期偶尔头晕。正在按医嘱服用降压药。上周做过血常规检查，准备下周复诊。";

const demoHealthSummary = `复诊摘要：
1. 已记录资料：2026-07-16 血压 145/92，近期偶尔头晕。正在按医嘱服用降压药。上周做过血常规检查，准备下周复诊。
2. 建议向医生说明：最近头晕频率、血压变化、用药时间。
3. 可询问医生：是否需要复查、指标是否需要继续观察、日常注意事项。

提醒：青团只整理资料，不做诊断，不建议改药量。`;

const demoFraudText = "客服说可以退款，但要我提供短信验证码，还让我赶紧转账验证。";

const demoFamilyEvents: FamilyEvent[] = [
  { title: "诈骗风险待核实", detail: "老人准备联系家人一起确认", level: "warning" },
  { title: "健康摘要已保存", detail: "老人生成了一份复诊摘要" },
  { title: "09:30 明天上午复诊", detail: "新增提醒，等待老人确认" },
  { title: "08:00 吃降压药", detail: "老人已确认完成" },
];

const fraudRules: FraudRule[] = [
  { label: "索要验证码", reason: "验证码等同于临时钥匙，正规人员不会要求您提供。", pattern: /验证码|动态码|短信码/ },
  { label: "催促转账", reason: "要求马上转账、汇款、打钱或付款验证，常见于诈骗话术。", pattern: /转账|汇款|打钱|付款|保证金/ },
  { label: "冒充客服或公检法", reason: "自称客服、公安、法院等身份时，需要通过官方渠道重新核实。", pattern: /客服|公安|警察|法院|检察院|公检法|银监/ },
  { label: "退款或中奖诱导", reason: "以退款、退费、理赔、中奖为理由索要信息或钱款，要先暂停。", pattern: /中奖|退款|退费|理赔|返钱/ },
  { label: "远程控制", reason: "要求共享屏幕、远程协助或下载软件，可能会看到您的账户信息。", pattern: /远程控制|共享屏幕|下载软件|远程协助/ },
  { label: "高收益投资", reason: "稳赚、保本、高收益和内部消息等承诺，风险很高。", pattern: /投资|高收益|稳赚|保本|理财群|内部消息/ },
  { label: "索要敏感信息", reason: "银行卡、密码、身份证号、账号等信息不能告诉陌生人。", pattern: /银行卡|密码|身份证|账号/ },
];

function getFraudFindings(text: string) {
  return fraudRules.filter((rule) => rule.pattern.test(text));
}

export default function Home() {
  const [page, setPage] = useState<Page>("welcome");
  const [storageReady, setStorageReady] = useState(false);
  const [status, setStatus] = useState("已准备好。");
  const [fontLevel, setFontLevel] = useState<FontLevel>(0);
  const [loudVolume, setLoudVolume] = useState(false);
  const [familyAccessEnabled, setFamilyAccessEnabled] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [fraudText, setFraudText] = useState("");
  const [fraudResult, setFraudResult] = useState<FraudResult>("none");
  const [guideType, setGuideType] = useState<keyof typeof guideFlows>("hospital");
  const [guideStep, setGuideStep] = useState(0);
  const [healthText, setHealthText] = useState("");
  const [healthSummary, setHealthSummary] = useState("");
  const [familyMessage, setFamilyMessage] = useState("");
  const [selectedContact, setSelectedContact] = useState("女儿王敏");
  const [messageConfirm, setMessageConfirm] = useState("");
  const [helpConfirm, setHelpConfirm] = useState("");
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderTime, setReminderTime] = useState("08:00");
  const [reminderConfirm, setReminderConfirm] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([
    { role: "bot", text: "您好，我在。想聊聊天，还是让我帮您办点事？" },
  ]);
  const [reminders, setReminders] = useState<Reminder[]>(defaultReminders);
  const [familyEvents, setFamilyEvents] = useState<FamilyEvent[]>(defaultFamilyEvents);

  const appClass = useMemo(() => {
    const mode = page === "welcome" ? "welcome-mode" : page === "familyDashboard" ? "family-mode" : "elder-mode";
    return `app-shell font-level-${fontLevel} ${mode}`;
  }, [fontLevel, page]);
  const fraudFindings = useMemo(() => getFraudFindings(fraudText), [fraudText]);
  const completedReminderCount = useMemo(() => reminders.filter((item) => item.done).length, [reminders]);
  const warningEventCount = useMemo(() => familyEvents.filter((item) => item.level === "warning" || item.level === "urgent").length, [familyEvents]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        const savedFontLevel = Number(saved.fontLevel);
        // The persisted prototype state is intentionally restored once after hydration.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFontLevel(savedFontLevel === 1 || savedFontLevel === 2 ? savedFontLevel : saved.largeFont ? 1 : 0);
        setLoudVolume(Boolean(saved.loudVolume));
        setFamilyAccessEnabled(saved.familyAccessEnabled !== false);
        setFraudText(saved.fraudText || "");
        setFraudResult(saved.fraudResult || "none");
        setHealthText(saved.healthText || "");
        setHealthSummary(saved.healthSummary || "");
        setFamilyMessage(saved.familyMessage || "");
        setSelectedContact(saved.selectedContact || "女儿王敏");
        if (Array.isArray(saved.reminders) && saved.reminders.length > 0) {
          setReminders(saved.reminders);
        }
        if (Array.isArray(saved.familyEvents) && saved.familyEvents.length > 0) {
          setFamilyEvents(saved.familyEvents);
        }
      }
    } catch {
      setStatus("本地保存读取失败，已使用默认数据。");
    } finally {
      setStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    const state = {
      fontLevel,
      loudVolume,
      familyAccessEnabled,
      fraudText,
      fraudResult,
      healthText,
      healthSummary,
      familyMessage,
      selectedContact,
      reminders,
      familyEvents,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [familyAccessEnabled, familyEvents, familyMessage, fontLevel, fraudResult, fraudText, healthSummary, healthText, loudVolume, reminders, selectedContact, storageReady]);

  function go(next: Page) {
    setPage(next);
    setStatus(`已进入：${pageNames[next]}`);
  }

  function addChat(role: "bot" | "user", text: string) {
    setChat((items) => [...items, { role, text }]);
  }

  function addFamilyEvent(title: string, detail: string, level: FamilyEvent["level"] = "normal") {
    if (!familyAccessEnabled) return;
    setFamilyEvents((items) => [{ title, detail, level }, ...items].slice(0, 8));
  }

  function toggleFamilyAccess() {
    setFamilyAccessEnabled((enabled) => {
      const next = !enabled;
      setStatus(next ? "已恢复家属协助授权。" : "已暂停家属协助授权。");
      return next;
    });
  }

  function loadDemoData() {
    setFontLevel(0);
    setLoudVolume(false);
    setFamilyAccessEnabled(true);
    setChatInput("");
    setFraudText(demoFraudText);
    setFraudResult("high");
    setHealthText(demoHealthText);
    setHealthSummary(demoHealthSummary);
    setFamilyMessage("我今天已经量过血压了，晚上在家吃饭。");
    setSelectedContact("女儿王敏");
    setMessageConfirm("");
    setHelpConfirm("");
    setReminderTitle("");
    setReminderTime("08:00");
    setReminderConfirm("");
    setReminders(demoReminders);
    setFamilyEvents(demoFamilyEvents);
    setChat([
      { role: "bot", text: "您好，我在。想聊聊天，还是让我帮您办点事？" },
      { role: "user", text: "有人说退款要验证码。" },
      { role: "bot", text: "这件事可能有风险。先不要转账，不要告诉任何人验证码。我可以帮您查一下风险。" },
    ]);
    go("chat");
    setStatus("演示数据已准备好。");
  }

  function resetDemoData() {
    localStorage.removeItem(STORAGE_KEY);
    setFontLevel(0);
    setLoudVolume(false);
    setFamilyAccessEnabled(true);
    setChatInput("");
    setFraudText("");
    setFraudResult("none");
    setHealthText("");
    setHealthSummary("");
    setFamilyMessage("");
    setSelectedContact("女儿王敏");
    setMessageConfirm("");
    setHelpConfirm("");
    setReminderTitle("");
    setReminderTime("08:00");
    setReminderConfirm("");
    setReminders(defaultReminders);
    setFamilyEvents(defaultFamilyEvents);
    setChat([{ role: "bot", text: "您好，我在。想聊聊天，还是让我帮您办点事？" }]);
    go("welcome");
    setStatus("本地演示数据已清空。");
  }

  function replyTo(text: string) {
    const urgent = /胸口|摔倒|急救|120/.test(text);
    const risky = /转账|验证码|银行卡|密码|退款|中奖|远程控制/.test(text);
    const reminder = /提醒|吃药|复诊|量血压/.test(text);

    if (urgent) {
      addChat("bot", "这可能比较紧急。请先坐稳或躺好，我建议您马上联系身边人或急救服务。");
      go("help");
      return;
    }

    if (risky) {
      addChat("bot", "这件事可能有风险。先不要转账，不要告诉任何人验证码。我可以帮您查一下风险。");
      setFraudText(text);
      go("fraud");
      return;
    }

    if (reminder) {
      addChat("bot", "好的，我们去设置提醒。我会先复述一遍，再请您确认。");
      setReminderTitle(text.replace("提醒我", "").trim() || "新的提醒");
      go("reminders");
      return;
    }

    addChat("bot", "我听着呢。您慢慢说。要是需要我帮忙，也可以直接说“设置提醒”或“找家里人”。");
  }

  function sendChatText() {
    const text = chatInput.trim();
    if (!text) return;
    setChatInput("");
    addChat("user", text);
    replyTo(text);
  }

  function startVoiceInput() {
    if (typeof window === "undefined") return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatus("当前浏览器暂不支持语音输入。请用 Chrome 或 Edge 试试。");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setVoiceState("listening");
    setStatus("正在听，请慢慢说。");

    recognition.onresult = (event: SpeechResultEvent) => {
      const text = event.results?.[0]?.[0]?.transcript?.trim();
      setVoiceState("idle");
      if (!text) {
        setStatus("没有听清楚，可以再试一次。");
        return;
      }
      go("chat");
      addChat("user", text);
      replyTo(text);
      setStatus(`已识别：${text}`);
    };

    recognition.onerror = () => {
      setVoiceState("idle");
      setStatus("语音输入没有成功，可以检查麦克风权限，或先用文字输入。");
    };

    recognition.onend = () => {
      setVoiceState("idle");
    };

    recognition.start();
  }

  function completeReminder(index: number) {
    const item = reminders[index];
    setReminders((items) => items.map((item, idx) => (idx === index ? { ...item, done: true } : item)));
    addFamilyEvent(`${item.time} ${item.title}`, "老人已确认完成");
    setStatus(`已记录完成：${item.title}`);
  }

  function delayReminder(index: number) {
    setStatus(`已延后 10 分钟：${reminders[index].title}`);
  }

  function prepareReminder() {
    const title = reminderTitle.trim();
    if (!title) {
      setStatus("请先填写提醒内容。");
      return;
    }
    const safeNote = title.includes("药") ? "我只负责提醒，不会建议改药量或停药。" : "";
    setReminderConfirm(`我将为您创建提醒：每天 ${reminderTime}，${title}。${safeNote}`);
  }

  function confirmReminder() {
    setReminders((items) => [...items, { title: reminderTitle.trim(), time: reminderTime, done: false }]);
    addFamilyEvent(`${reminderTime} ${reminderTitle.trim()}`, "新增提醒，等待老人确认");
    setReminderConfirm("");
    setReminderTitle("");
    setStatus("提醒已创建。");
  }

  function analyzeFraud() {
    if (!fraudText.trim()) {
      setStatus("请先输入要分析的内容。");
      return;
    }
    setFraudResult(getFraudFindings(fraudText).length > 0 ? "high" : "careful");
    setStatus("反诈骗分析已完成。");
  }

  function generateHealthSummary() {
    const text = healthText.trim();
    if (!text) {
      setStatus("请先填写或粘贴健康资料内容。");
      return;
    }
    setHealthSummary(`复诊摘要：\n1. 已记录资料：${text.slice(0, 80)}${text.length > 80 ? "……" : ""}\n2. 建议向医生说明：最近症状变化、用药情况、检查时间。\n3. 可询问医生：是否需要复查、指标是否需要继续观察、日常注意事项。\n\n提醒：青团只整理资料，不做诊断，不建议改药量。`);
    setStatus("复诊摘要已生成。");
  }

  function prepareMessage() {
    if (!familyMessage.trim()) {
      setStatus("请先填写要发给家人的消息。");
      return;
    }
    setMessageConfirm(`接收人：${selectedContact}\n消息：${familyMessage.trim()}`);
  }

  function renderReminders() {
    return reminders.map((item, index) => (
      <div className={`reminder-item ${item.done ? "is-done" : ""}`} key={`${item.time}-${item.title}-${index}`}>
        <time className="reminder-time">{item.time}</time>
        <div className="reminder-symbol" aria-hidden="true">{item.title.includes("药") ? "药" : "压"}</div>
        <div className="reminder-copy">
          <strong>{item.title}</strong>
          <span className={`reminder-state ${item.done ? "done" : "pending"}`}>{item.done ? "已完成" : "等待提醒"}</span>
        </div>
        <div className="reminder-actions">
          <button className="btn reminder-complete" disabled={item.done} onClick={() => completeReminder(index)}>
            {item.done ? "已完成" : "完成"}
          </button>
          <button className="btn" onClick={() => delayReminder(index)}>
            延后10分钟
          </button>
        </div>
      </div>
    ));
  }

  return (
    <div className={appClass}>
      {page === "welcome" ? (
        <main className="welcome-main">
          <section className="welcome-page">
            <div className="welcome-mark">
              <img src="/brand/qingtuan-logo.png" alt="青团智能体 logo" />
            </div>
            <div className="welcome-copy">
              <h1>
                <span className="welcome-hello">您好，</span>
                <span className="welcome-name">我是青团智能体</span>
              </h1>
            </div>
            <div className="welcome-panel">
              <div className="welcome-capabilities">
                <strong>今天可以帮您</strong>
                <div className="capability-list" aria-label="青团智能体的主要功能">
                  <span>生活提醒</span>
                  <span>防诈识别</span>
                  <span>复诊整理</span>
                  <span>联系家人</span>
                </div>
              </div>
              <button className="btn block welcome-entry senior" onClick={() => go("chat")}>
                <span className="entry-index">01</span>
                <span className="entry-label"><strong>老人端进入</strong><small>开始陪伴与生活助手</small></span>
                <span className="entry-arrow" aria-hidden="true">›</span>
              </button>
              <button className="btn block welcome-entry family" onClick={() => go("familyDashboard")}>
                <span className="entry-index">02</span>
                <span className="entry-label"><strong>家属端入口</strong><small>查看动态与协同照护</small></span>
                <span className="entry-arrow" aria-hidden="true">›</span>
              </button>
              <button className="btn block welcome-entry help" onClick={() => go("help")}>
                <span className="entry-index">03</span>
                <span className="entry-label"><strong>我需要帮助</strong><small>快速联系家人与急救</small></span>
                <span className="entry-arrow" aria-hidden="true">›</span>
              </button>
            </div>
            <div className="demo-tools">
              <button className="demo-dot load" onClick={loadDemoData} title="加载演示数据" aria-label="加载演示数据" />
              <button className="demo-dot reset" onClick={resetDemoData} title="清空本地数据" aria-label="清空本地数据" />
            </div>
          </section>
        </main>
      ) : (
        <>
          {page === "familyDashboard" ? (
            <aside className="side" aria-label="主导航">
              <div className="brand">
                <div className="logo"><img src="/brand/qingtuan-logo.png" alt="" /></div>
                <span>青团智能体</span>
              </div>
              <nav className="nav">
                {(["chat", "reminders", "guide", "health", "fraud", "familyDashboard", "family", "help"] as Page[]).map((item) => (
                  <button className={page === item ? "active" : ""} key={item} onClick={() => go(item)}>
                    {pageNames[item]}
                  </button>
                ))}
              </nav>
              <p className="side-note">陪伴、提醒、办事与家属协同，让重要的事情更安心。</p>
            </aside>
          ) : (
            <aside className="elder-sidebar" aria-label="老人端导航">
              <button className="elder-brand" onClick={() => go("chat")} aria-label="进入和青团说话">
                <span className="logo"><img src="/brand/qingtuan-logo.png" alt="" /></span>
                <span><strong>青团智能体</strong><small><i aria-hidden="true" />青团在这里</small></span>
              </button>

              <nav className="elder-nav" aria-label="老人端主要功能">
                {elderNavItems.map((item) => (
                  <button className={page === item.page ? "active" : ""} key={item.page} onClick={() => go(item.page)}>
                    <span className="nav-symbol"><UiIcon name={item.icon} /></span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>

              <div className="elder-utilities" aria-label="显示与声音设置">
                <button
                  className="utility"
                  onClick={() => {
                    const nextLevel = ((fontLevel + 1) % 3) as FontLevel;
                    setFontLevel(nextLevel);
                    setStatus(`已切换为${fontLevelLabels[nextLevel]}。`);
                  }}
                >
                  <UiIcon name="type" /><span>字体大小</span><small>{fontLevel === 0 ? "中" : fontLevel === 1 ? "大" : "特大"}</small>
                </button>
                <button
                  className="utility"
                  onClick={() => {
                    setLoudVolume(!loudVolume);
                    setStatus(!loudVolume ? "音量已调大。" : "音量已恢复正常。");
                  }}
                >
                  <UiIcon name="volume" /><span>声音设置</span><small>{loudVolume ? "较大" : "正常"}</small>
                </button>
                <button className="utility help" onClick={() => go("help")}><UiIcon name="alert" /><span>紧急求助</span></button>
              </div>
            </aside>
          )}

          <main className={page === "familyDashboard" ? "main family-main" : "main elder-main"}>

        {page === "chat" && (
          <section className="page active chat-page">
            <div className="chat-primary">
              <header className="chat-welcome">
                <p className="gentle-status"><span aria-hidden="true" />青团在这里</p>
                <h1>下午好，李阿姨</h1>
                <p>今天想聊点什么，或者需要我帮您办件事？</p>
              </header>

              <div className="conversation-area">
                <div className="assistant-row">
                  <span className="assistant-avatar"><img src="/brand/qingtuan-logo.png" alt="" /></span>
                  <div className="bubble bot">您好，我在。您可以直接说，也可以点下面常用的事情。</div>
                </div>

                {chat.slice(1).map((item, index) => (
                  <div className={`bubble ${item.role}`} key={`${item.role}-${index}`}>{item.text}</div>
                ))}

                <div className="quick-actions" aria-label="常用事情">
                  <button onClick={() => go("guide")}><span className="quick-icon"><UiIcon name="hospital" /></span><span>问问怎么去医院</span><UiIcon name="chevron" className="quick-chevron" /></button>
                  <button onClick={() => go("reminders")}><span className="quick-icon"><UiIcon name="calendar" /></span><span>看看今天的提醒</span><UiIcon name="chevron" className="quick-chevron" /></button>
                  <button onClick={() => go("fraud")}><span className="quick-icon"><UiIcon name="message" /></span><span>帮我看看这条消息</span><UiIcon name="chevron" className="quick-chevron" /></button>
                </div>
              </div>

              <div className="chat-composer">
                <label className="chat-input-wrap">
                  <span className="sr-only">输入想说的话</span>
                  <input value={chatInput} onChange={(event) => setChatInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && sendChatText()} placeholder="输入想说的话" />
                </label>
                <div className="composer-actions">
                  <button className="composer-secondary" onClick={() => setStatus("已重复上一句播报。") }><UiIcon name="replay" /><span>重复上一句</span></button>
                  <button className={`voice ${voiceState === "listening" ? "listening" : ""}`} onClick={startVoiceInput} aria-pressed={voiceState === "listening"}>
                    <UiIcon name="mic" /><strong>{voiceState === "listening" ? "正在听，请慢慢说" : "按住说话"}</strong>
                  </button>
                  <button className="composer-secondary" onClick={() => go("family")}><UiIcon name="family" /><span>联系家人</span></button>
                  <button className="send-round" onClick={sendChatText} aria-label="发送消息"><UiIcon name="send" /></button>
                </div>
              </div>
            </div>

            <aside className="chat-context" aria-label="今天的提醒与家人">
              <section className="context-section today-section">
                <div className="context-heading"><UiIcon name="leaf" /><h2>今天</h2></div>
                <p className="context-date">{new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" }).format(new Date())}</p>
                <div className="context-reminders">
                  {reminders.slice(0, 2).map((item) => (
                    <button key={`${item.time}-${item.title}`} onClick={() => go("reminders")} className={item.done ? "done" : "pending"}>
                      <time>{item.time}</time><span>{item.title}</span><small>{item.done ? <><UiIcon name="check" />已完成</> : <><UiIcon name="clock" />待完成</>}</small>
                    </button>
                  ))}
                </div>
              </section>

              <section className="context-section family-preview">
                <div className="context-heading"><UiIcon name="family" /><h2>家人</h2></div>
                <div className="family-person">
                  <span className="family-avatar"><img src="/brand/family-avatar.png" alt="王敏" /></span>
                  <span><small>女儿</small><strong>王敏</strong></span>
                  <button onClick={() => go("family")}>联系她</button>
                </div>
                <p className="privacy-copy"><UiIcon name="privacy" />只有您主动分享的内容会发送给家人</p>
              </section>
            </aside>
          </section>
        )}

        {page === "reminders" && (
          <section className="page active reminders-page">
            <PageHeader title="提醒管理" />
            <div className="reminder-composer">
              <h2>新建提醒</h2>
              <div className="reminder-form">
                <label className="reminder-field">
                  <span>提醒内容</span>
                  <input value={reminderTitle} onChange={(event) => setReminderTitle(event.target.value)} placeholder="例如：吃降压药" />
                </label>
                <label className="reminder-field time-field">
                  <span>提醒时间</span>
                  <input type="time" value={reminderTime} onChange={(event) => setReminderTime(event.target.value)} />
                </label>
                <button className="btn primary" onClick={prepareReminder}>
                  创建提醒
                </button>
              </div>
              {reminderConfirm && (
                <div className="result confirm">
                  <strong>请确认：</strong>
                  <br />
                  {reminderConfirm}
                  <div className="actions top-gap">
                    <button className="btn primary" onClick={confirmReminder}>
                      确认创建
                    </button>
                    <button className="btn" onClick={() => setReminderConfirm("")}>
                      先不创建
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="reminder-schedule">
              <div className="reminder-heading">
                <h2>今日提醒</h2>
                <span>{reminders.filter((item) => !item.done).length} 项待处理</span>
              </div>
              <div className="reminder-list">{renderReminders()}</div>
            </div>
          </section>
        )}

        {page === "guide" && (
          <section className="page active">
            <PageHeader title="办事分步指导" desc="一次只讲一步，老人可以重复、上一步、下一步或退出。" />
            <div className="card">
              <h2>选择要办的事</h2>
              <div className="grid three">
                <button className={`btn feature ${guideType === "hospital" ? "primary" : ""}`} onClick={() => { setGuideType("hospital"); setGuideStep(0); }}>
                  手机挂号
                </button>
                <button className={`btn feature ${guideType === "bus" ? "primary" : ""}`} onClick={() => { setGuideType("bus"); setGuideStep(0); }}>
                  查公交路线
                </button>
                <button className={`btn feature ${guideType === "qr" ? "primary" : ""}`} onClick={() => { setGuideType("qr"); setGuideStep(0); }}>
                  扫二维码
                </button>
              </div>
            </div>
            <div className="card">
              <h2>当前步骤</h2>
              <div className="step-number">第 {guideStep + 1} 步 / 共 {guideFlows[guideType].length} 步</div>
              <p className="step-text">{guideFlows[guideType][guideStep]}</p>
              <div className="actions">
                <button className="btn" onClick={() => setStatus(`重复：${guideFlows[guideType][guideStep]}`)}>
                  重复这一句
                </button>
                <button className="btn" disabled={guideStep === 0} onClick={() => setGuideStep(Math.max(0, guideStep - 1))}>
                  上一步
                </button>
                <button className="btn primary" disabled={guideStep === guideFlows[guideType].length - 1} onClick={() => setGuideStep(Math.min(guideFlows[guideType].length - 1, guideStep + 1))}>
                  下一步
                </button>
                <button className="btn" onClick={() => go("chat")}>
                  退出指导
                </button>
              </div>
            </div>
          </section>
        )}

        {page === "health" && (
          <section className="page active health-page">
            <header className="health-header">
              <div className="health-title-row">
                <span className="health-record-mark" aria-hidden="true"><i /><i /><i /></span>
                <h1>健康资料整理</h1>
                <span className="health-local-badge"><b aria-hidden="true">◇</b> 仅在本地整理</span>
              </div>
              <p>整理检查报告、处方和测量记录，为复诊做好准备。</p>
            </header>

            <div className="health-breadcrumb" aria-label="当前位置">
              <span aria-hidden="true">⌂</span>
              <span>健康资料</span>
              <b aria-hidden="true">/</b>
              <span>录入</span>
            </div>

            <ol className="health-steps" aria-label="复诊摘要生成步骤">
              <li className={!healthSummary ? "active" : "done"}><span>1</span><strong>录入资料</strong></li>
              <li className={healthSummary ? "done" : ""}><span>2</span><strong>核对信息</strong></li>
              <li className={healthSummary ? "active" : ""}><span>3</span><strong>生成摘要</strong></li>
            </ol>

            <div className="health-workspace">
              <div className="health-entry-panel">
                <h2>添加健康资料</h2>
                <div className="health-source-tabs" role="tablist" aria-label="资料录入方式">
                  <button className="active" type="button" role="tab" aria-selected="true" onClick={() => setStatus("当前为粘贴文字录入。")}>
                    <span aria-hidden="true">文</span>粘贴文字
                  </button>
                  <button type="button" role="tab" aria-selected="false" onClick={() => setStatus("图片上传功能后续接入。")}>
                    <span aria-hidden="true">图</span>上传图片
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected="false"
                    onClick={() => {
                      document.getElementById("health-text-input")?.focus();
                      setStatus("请在下方手动记录健康资料。");
                    }}
                  >
                    <span aria-hidden="true">记</span>手动记录
                  </button>
                </div>
                <label className="health-text-field" htmlFor="health-text-input">
                  <span className="sr-only">健康资料内容</span>
                  <textarea
                    id="health-text-input"
                    value={healthText}
                    onChange={(event) => setHealthText(event.target.value)}
                    placeholder="粘贴检查报告、处方内容，或血压、血糖等测量记录…"
                  />
                </label>
                <div className="health-actions">
                  <button className="health-sample-button" type="button" onClick={() => setHealthText("2026-07-16 血压 145/92，近期偶尔头晕。正在按医嘱服用降压药。")}>
                    <span aria-hidden="true">✧</span>填入示例
                  </button>
                  <span className="health-action-note"><i aria-hidden="true" />生成前可继续修改</span>
                  <button className="health-generate-button" type="button" onClick={generateHealthSummary}>
                    生成复诊摘要 <span aria-hidden="true">→</span>
                  </button>
                </div>
              </div>

              <aside className="health-preview" aria-label="复诊摘要内容预览">
                <h2>复诊摘要将包含</h2>
                <ul>
                  <li><span aria-hidden="true">✓</span>主要检查结果</li>
                  <li><span aria-hidden="true">✓</span>用药与处方</li>
                  <li><span aria-hidden="true">✓</span>血压与血糖记录</li>
                  <li><span aria-hidden="true">✓</span>待向医生确认的问题</li>
                </ul>
                <div className="health-document-art" aria-hidden="true">
                  <span className="document-line wide" />
                  <span className="document-line medium" />
                  <span className="document-line short" />
                  <div className="document-table">
                    <i /><i /><i /><i /><i /><i />
                    <b className="bar one" /><b className="bar two" /><b className="bar three" />
                  </div>
                </div>
              </aside>
            </div>

            {healthSummary && (
              <div className="result health-summary-output" aria-live="polite">
                <h2>已生成复诊摘要</h2>
                <pre>{healthSummary}</pre>
                <div className="actions top-gap">
                  <button
                    className="btn primary"
                    onClick={() => {
                      addFamilyEvent("健康摘要已保存", "老人生成了一份复诊摘要");
                      setStatus("复诊摘要已保存。");
                    }}
                  >
                    保存摘要
                  </button>
                  <button
                    className="btn"
                    onClick={() => {
                      addFamilyEvent("健康资料分享", "老人主动分享了复诊摘要");
                      go("familyDashboard");
                    }}
                  >
                    分享给家人
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {page === "fraud" && (
          <section className="page active fraud-page">
            <header className="fraud-intro">
              <p className="fraud-reassurance">先别着急，我们陪您一起看看</p>
              <h1>查一查是不是诈骗</h1>
              <p>把短信、聊天内容或电话里听到的话粘贴进来，我们会帮您找出可疑信号。</p>
            </header>

            <div className="fraud-workspace">
              <div className="fraud-entry">
                <label htmlFor="fraud-text"><UiIcon name="message" />输入可疑内容</label>
                <textarea
                  id="fraud-text"
                  value={fraudText}
                  onChange={(event) => {
                    setFraudText(event.target.value);
                    setFraudResult("none");
                  }}
                  placeholder="把内容粘贴在这里……"
                  aria-describedby="fraud-field-help"
                />
                <p className="fraud-field-help" id="fraud-field-help">
                  不用整理格式，保留对方的原话更容易发现风险。
                </p>
                <div className="actions fraud-actions">
                  <button className="btn primary fraud-primary" onClick={analyzeFraud}>
                    <UiIcon name="shield" />开始分析
                  </button>
                  <button
                    className="btn fraud-sample"
                    onClick={() => {
                      setFraudText("客服说可以退款，但要我提供短信验证码，还让我赶紧转账验证。");
                      setFraudResult("none");
                    }}
                  >
                    <UiIcon name="leaf" />试试示例
                  </button>
                </div>
                <p className="fraud-privacy"><UiIcon name="privacy" />输入内容只保存在这台设备上</p>
              </div>

              <aside className="fraud-safety" aria-labelledby="fraud-safety-title">
                <div className="fraud-safety-heading">
                  <span><UiIcon name="shield" /></span>
                  <div>
                    <h2 id="fraud-safety-title">先暂停，再核实</h2>
                    <p>遇到可疑信息，先记住这三件事。</p>
                  </div>
                </div>
                <ol className="fraud-safety-list">
                  <li><span><UiIcon name="alert" /></span><div><strong>不转账</strong><p>不要向陌生账户付款。</p></div></li>
                  <li><span><UiIcon name="privacy" /></span><div><strong>不给验证码</strong><p>验证码和密码都不能告诉别人。</p></div></li>
                  <li><span><UiIcon name="check" /></span><div><strong>通过官方渠道确认</strong><p>重新拨打官方电话或到线下网点核实。</p></div></li>
                </ol>
              </aside>
            </div>

            {fraudResult !== "none" && (
              <div className={`result fraud-result ${fraudResult === "high" ? "high" : ""}`}>
                {fraudResult === "high" ? (
                  <>
                    <strong>风险等级：高</strong>
                    <div className="risk-tags">
                      {fraudFindings.map((item) => (
                        <span className="risk-tag" key={item.label}>
                          {item.label}
                        </span>
                      ))}
                    </div>
                    <strong>为什么要小心：</strong>
                    <ul className="risk-list">
                      {fraudFindings.map((item) => (
                        <li key={item.reason}>{item.reason}</li>
                      ))}
                    </ul>
                    <strong>建议下一步：</strong>
                    <ul className="risk-list">
                      <li>先停止回复，不要转账。</li>
                      <li>不要提供验证码、密码、银行卡或身份证信息。</li>
                      <li>通过官方电话、官方 App 或线下网点重新核实。</li>
                      <li>联系家人一起确认。</li>
                    </ul>
                    <p className="safe-note">青团只能提示疑似风险，不做绝对判定。</p>
                    <div className="actions top-gap">
                      <button
                        className="btn primary"
                        onClick={() => {
                          addFamilyEvent("诈骗风险待核实", "老人准备联系家人一起确认", "warning");
                          go("family");
                        }}
                      >
                        联系家人核实
                      </button>
                      <button
                        className="btn"
                        onClick={() => {
                          addFamilyEvent("诈骗风险提醒", "老人保存了一条高风险核实记录", "warning");
                          setStatus("记录已保存。");
                        }}
                      >
                        保存记录
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <strong>风险等级：需谨慎</strong>
                    <p>暂未发现明显高风险词，但仍建议通过官方渠道核实，不要轻易转账或透露个人信息。</p>
                    <ul className="risk-list">
                      <li>如果对方要求转账、验证码或远程控制，请立刻停止。</li>
                      <li>不确定时，先联系家人一起看。</li>
                    </ul>
                  </>
                )}
              </div>
            )}
          </section>
        )}


        {page === "familyDashboard" && (
          <section className="page active">
            <PageHeader title="家属端" desc="家属只查看授权范围内的信息，协助提醒和接收必要通知。" />
            <div className="grid three">
              <div className="stat-card">
                <span className="muted">当前绑定老人</span>
                <strong>李阿姨</strong>
                <span>{familyAccessEnabled ? "授权协助中" : "已暂停授权"}</span>
              </div>
              <div className="stat-card">
                <span className="muted">今日提醒</span>
                <strong>{reminders.length} 项</strong>
                <span>{completedReminderCount} 项已完成，{Math.max(reminders.length - completedReminderCount, 0)} 项待确认</span>
              </div>
              <div className="stat-card">
                <span className="muted">风险通知</span>
                <strong>{warningEventCount} 条</strong>
                <span>{warningEventCount > 0 ? "有需要家属关注的事件" : "暂无高风险事件"}</span>
              </div>
            </div>
            <div className="card">
              <h2>授权范围</h2>
              <div className="permission-list">
                <span>可协助设置提醒</span>
                <span>可接收紧急求助通知</span>
                <span>可查看老人主动分享的健康摘要</span>
                <span>不可查看完整私密对话</span>
              </div>
              <div className="privacy-note">
                当前状态：{familyAccessEnabled ? "家属可以看到老人主动分享的提醒、健康摘要、风险核实和求助通知。" : "授权已暂停，新的操作不会继续同步到家属端。"}
              </div>
              <div className="actions top-gap">
                <button className={familyAccessEnabled ? "btn" : "btn primary"} onClick={toggleFamilyAccess}>
                  {familyAccessEnabled ? "暂停家属协助" : "恢复家属协助"}
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    setFamilyEvents([]);
                    setStatus("最近通知已清空。");
                  }}
                >
                  清空最近通知
                </button>
              </div>
            </div>
            <div className="card">
              <h2>家属可做的事</h2>
              <div className="grid three">
                <button className="btn feature" onClick={() => go("reminders")}>协助设置提醒</button>
                <button className="btn feature" onClick={() => go("family")}>发送问候消息</button>
                <button className="btn feature" onClick={() => setStatus("已查看授权范围。")}>查看授权信息</button>
              </div>
            </div>
            <div className="card">
              <h2>最近通知</h2>
              <div className="notice-list">
                {familyEvents.length > 0 ? (
                  familyEvents.map((item, index) => (
                    <div className={item.level === "urgent" ? "urgent" : item.level === "warning" ? "warning" : ""} key={`${item.title}-${index}`}>
                      <strong>{item.title}</strong>
                      <span className="muted">{item.detail}</span>
                    </div>
                  ))
                ) : (
                  <div><strong>暂无通知</strong><span className="muted">老人主动分享后会显示在这里</span></div>
                )}
              </div>
            </div>
          </section>
        )}
        {page === "family" && (
          <section className="page active">
            <PageHeader title="找家里人" desc="发送前会复述联系人和完整消息。" />
            <div className="card">
              <h2>选择联系人</h2>
              <div className="grid">
                {["女儿王敏", "儿子李强"].map((contact) => (
                  <label className="family-card" key={contact}>
                    <span>
                      {contact} <span className="muted">{contact === "女儿王敏" ? "主联系人" : "备用联系人"}</span>
                    </span>
                    <input type="radio" name="contact" checked={selectedContact === contact} onChange={() => setSelectedContact(contact)} />
                  </label>
                ))}
              </div>
            </div>
            <div className="card">
              <h2>消息内容</h2>
              <textarea value={familyMessage} onChange={(event) => setFamilyMessage(event.target.value)} placeholder="例如：我今天挺好的，晚上不回家吃饭。" />
              <div className="actions top-gap">
                <button className="btn primary" onClick={prepareMessage}>
                  准备发送
                </button>
              </div>
              {messageConfirm && (
                <div className="result confirm">
                  <strong>发送前请确认：</strong>
                  <pre>{messageConfirm}</pre>
                  <div className="actions top-gap">
                    <button
                      className="btn primary"
                      onClick={() => {
                        setMessageConfirm(`消息已模拟发送给${selectedContact}。`);
                        addFamilyEvent("老人发送消息", `已发送给${selectedContact}`);
                        setStatus("消息已发送。");
                      }}
                    >
                      确认发送
                    </button>
                    <button className="btn" onClick={() => setMessageConfirm("")}>
                      先不发送
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {page === "help" && (
          <section className="page active">
            <PageHeader title="紧急求助" desc="如果胸口痛、摔倒、明显不舒服，请尽快联系身边人或急救服务。" />
            <div className="card">
              <h2>请选择求助方式</h2>
              <div className="grid two">
                <button className="btn danger block" onClick={() => setHelpConfirm("是否现在拨打 120？")}>
                  拨打 120
                </button>
                <button className="btn primary block" onClick={() => setHelpConfirm("是否现在联系女儿王敏？")}>
                  联系女儿王敏
                </button>
              </div>
              {helpConfirm && (
                <div className="result confirm">
                  <strong>请确认：</strong>
                  <br />
                  {helpConfirm} 如果情况紧急，请优先联系身边真实人员或当地急救服务。
                  <div className="actions top-gap">
                    <button
                      className="btn danger"
                      onClick={() => {
                        setHelpConfirm("已模拟执行求助操作。请保持电话畅通，并尽量让身边人知道您的位置。");
                        addFamilyEvent("紧急求助", "老人已确认执行求助流程", "urgent");
                        setStatus("求助流程已执行。");
                      }}
                    >
                      确认执行
                    </button>
                    <button className="btn" onClick={() => setHelpConfirm("")}>
                      先不执行
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        <div className={`footer-status ${page === "health" ? "health-status" : page === "chat" ? "chat-hidden" : ""}`} role="status" aria-live="polite">{status}</div>
          </main>
        </>
      )}
    </div>
  );
}

function PageHeader({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="topbar">
      <div className="hello">
        <h1>{title}</h1>
        {desc && <p>{desc}</p>}
      </div>
    </div>
  );
}




