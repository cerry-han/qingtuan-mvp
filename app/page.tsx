"use client";

import { useEffect, useMemo, useState } from "react";

type Page = "welcome" | "home" | "chat" | "reminders" | "guide" | "health" | "fraud" | "familyDashboard" | "family" | "help";
type ChatMessage = { role: "bot" | "user"; text: string };
type Reminder = { title: string; time: string; done: boolean };
type FraudResult = "none" | "high" | "careful";
type FraudRule = { label: string; reason: string; pattern: RegExp };
type FamilyEvent = { title: string; detail: string; level?: "normal" | "warning" | "urgent" };

const STORAGE_KEY = "qingtuan-mvp-state";

const pageNames: Record<Page, string> = {
  welcome: "欢迎页",
  home: "首页",
  chat: "对话陪伴",
  reminders: "提醒管理",
  guide: "办事指导",
  health: "健康资料",
  fraud: "查诈骗风险",
  familyDashboard: "家属端",
  family: "找家里人",
  help: "紧急求助",
};

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
  const [largeFont, setLargeFont] = useState(false);
  const [loudVolume, setLoudVolume] = useState(false);
  const [familyAccessEnabled, setFamilyAccessEnabled] = useState(true);
  const [homeInput, setHomeInput] = useState("");
  const [chatInput, setChatInput] = useState("");
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

  const appClass = useMemo(() => `app-shell${largeFont ? " large-font" : ""}`, [largeFont]);
  const fraudFindings = useMemo(() => getFraudFindings(fraudText), [fraudText]);
  const completedReminderCount = useMemo(() => reminders.filter((item) => item.done).length, [reminders]);
  const warningEventCount = useMemo(() => familyEvents.filter((item) => item.level === "warning" || item.level === "urgent").length, [familyEvents]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        setLargeFont(Boolean(saved.largeFont));
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
      largeFont,
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
  }, [familyAccessEnabled, familyEvents, familyMessage, fraudResult, fraudText, healthSummary, healthText, largeFont, loudVolume, reminders, selectedContact, storageReady]);

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
    setLargeFont(false);
    setLoudVolume(false);
    setFamilyAccessEnabled(true);
    setHomeInput("");
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
    go("home");
    setStatus("演示数据已准备好。");
  }

  function resetDemoData() {
    localStorage.removeItem(STORAGE_KEY);
    setLargeFont(false);
    setLoudVolume(false);
    setFamilyAccessEnabled(true);
    setHomeInput("");
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

  function sendHomeText() {
    const text = homeInput.trim();
    if (!text) return;
    setHomeInput("");
    go("chat");
    addChat("user", text);
    replyTo(text);
  }

  function sendChatText() {
    const text = chatInput.trim();
    if (!text) return;
    setChatInput("");
    addChat("user", text);
    replyTo(text);
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
      <div className="reminder-item" key={`${item.time}-${item.title}-${index}`}>
        <strong>
          {item.time} {item.title}
        </strong>
        <span className="muted">{item.done ? "已完成" : "等待提醒"}</span>
        <div className="actions">
          <button className="btn" onClick={() => completeReminder(index)}>
            完成
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
              <span>青</span>
            </div>
            <div className="welcome-copy">
              <p className="eyebrow">青团智能体 MVP</p>
              <h1>您好，我是青团。</h1>
              <p>一个面向老年人的陪伴与生活服务助手。说得慢一点，按钮大一点，重要事情先确认。</p>
            </div>
            <div className="welcome-panel">
              <div>
                <strong>今天可以帮您：</strong>
                <span>设置提醒、识别诈骗、整理复诊资料、联系家人。</span>
              </div>
              <button className="btn primary block" onClick={() => go("home")}>
                老人端进入
              </button>
              <button className="btn block" onClick={() => go("familyDashboard")}>
                家属端入口
              </button>
              <button className="btn block" onClick={() => go("help")}>
                我需要帮助
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
          <aside className="side" aria-label="主导航">
            <div className="brand">
              <div className="logo">青</div>
              <span>青团智能体</span>
            </div>
            <nav className="nav">
              {(["home", "chat", "reminders", "guide", "health", "fraud", "familyDashboard", "family", "help"] as Page[]).map((item) => (
                <button className={page === item ? "active" : ""} key={item} onClick={() => go(item)}>
                  {pageNames[item]}
                </button>
              ))}
            </nav>
            <p className="side-note">MVP 演示版：先跑通老人端主流程，真实语音、OCR 和消息接口后续接入。</p>
          </aside>

          <main className="main">

        {page === "home" && (
          <section className="page active">
            <div className="topbar">
              <div className="hello">
                <h1>您好，李阿姨。</h1>
                <p>今天想让我帮您做什么？</p>
              </div>
              <div className="quick-settings">
                <button
                  className="btn"
                  onClick={() => {
                    setLargeFont(!largeFont);
                    setStatus(!largeFont ? "字体已加大。" : "字体已恢复。");
                  }}
                >
                  {largeFont ? "恢复字体" : "字体加大"}
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    setLoudVolume(!loudVolume);
                    setStatus("音量设置已切换。");
                  }}
                >
                  {loudVolume ? "音量较大" : "音量正常"}
                </button>
              </div>
            </div>

            <button
              className="voice"
              onClick={() => {
                go("chat");
                addChat("user", "我想设置一个吃药提醒。");
                replyTo("提醒我吃药");
              }}
            >
              按住和青团说话
            </button>

            <div className="card">
              <div className="text-row">
                <input value={homeInput} onChange={(event) => setHomeInput(event.target.value)} placeholder="也可以打字：今天想问什么？" />
                <button className="btn primary" onClick={sendHomeText}>
                  发送
                </button>
              </div>
            </div>

            <div className="card">
              <h2>今日提醒</h2>
              <div className="grid two">{renderReminders()}</div>
            </div>

            <div className="card">
              <h2>常用功能</h2>
              <div className="grid three">
                <button className="btn feature" onClick={() => go("chat")}>
                  陪我说说话
                </button>
                <button className="btn feature" onClick={() => go("reminders")}>
                  设置提醒
                </button>
                <button className="btn feature" onClick={() => go("guide")}>
                  办事指导
                </button>
                <button className="btn feature" onClick={() => go("fraud")}>
                  查诈骗风险
                </button>
                <button className="btn feature" onClick={() => go("health")}>
                  整理健康资料
                </button>
                <button className="btn feature" onClick={() => go("family")}>
                  找家里人
                </button>
              </div>
            </div>

            <div className="grid two">
              <button className="btn danger block" onClick={() => go("help")}>
                我需要帮助
              </button>
              <button className="btn block" onClick={() => setStatus("好的，先不做了。")}>
                先不做了
              </button>
            </div>
          </section>
        )}

        {page === "chat" && (
          <section className="page active">
            <PageHeader title="对话陪伴" desc="青团会简短回答，并在高风险场景提醒确认。" onBack={() => go("home")} />
            <div className="card chat-box">
              {chat.map((item, index) => (
                <div className={`bubble ${item.role}`} key={`${item.role}-${index}`}>
                  {item.text}
                </div>
              ))}
            </div>
            <div className="card">
              <div className="text-row">
                <input value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder="输入想说的话，例如：我今天有点闷" />
                <button className="btn primary" onClick={sendChatText}>
                  发送
                </button>
              </div>
            </div>
            <div className="actions">
              <button className="btn" onClick={() => setStatus("已重复上一句播报。")}>
                重复一遍
              </button>
              <button className="btn" onClick={() => addChat("bot", "我们可以聊聊今天的天气、家里人，或者您年轻时候喜欢做的事。")}>
                换个话题
              </button>
              <button className="btn" onClick={() => go("family")}>
                联系家人
              </button>
            </div>
          </section>
        )}

        {page === "reminders" && (
          <section className="page active">
            <PageHeader title="提醒管理" desc="吃药、复诊、量血压，都要先复述确认。" onBack={() => go("home")} />
            <div className="card">
              <h2>新建提醒</h2>
              <div className="grid two">
                <input value={reminderTitle} onChange={(event) => setReminderTitle(event.target.value)} placeholder="提醒内容，例如：吃降压药" />
                <input type="time" value={reminderTime} onChange={(event) => setReminderTime(event.target.value)} />
              </div>
              <div className="actions top-gap">
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
            <div className="card">
              <h2>今日提醒</h2>
              <div className="grid">{renderReminders()}</div>
            </div>
          </section>
        )}

        {page === "guide" && (
          <section className="page active">
            <PageHeader title="办事分步指导" desc="一次只讲一步，老人可以重复、上一步、下一步或退出。" onBack={() => go("home")} />
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
                <button className="btn" onClick={() => go("home")}>
                  退出指导
                </button>
              </div>
            </div>
          </section>
        )}

        {page === "health" && (
          <section className="page active">
            <PageHeader title="健康资料整理" desc="整理检查报告、处方和测量记录，只做复诊准备，不做诊断。" onBack={() => go("home")} />
            <div className="card">
              <h2>录入资料</h2>
              <textarea value={healthText} onChange={(event) => setHealthText(event.target.value)} placeholder="可以先粘贴检查报告文字、处方内容或血压血糖记录。图片 OCR 后续接入。" />
              <div className="actions top-gap">
                <button className="btn primary" onClick={generateHealthSummary}>
                  生成复诊摘要
                </button>
                <button className="btn" onClick={() => setHealthText("2026-07-16 血压 145/92，近期偶尔头晕。正在按医嘱服用降压药。")}>
                  填入示例
                </button>
              </div>
            </div>
            {healthSummary && (
              <div className="result">
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
          <section className="page active">
            <PageHeader title="查诈骗风险" desc="先暂停操作，不转账，不给验证码，再核实。" onBack={() => go("home")} />
            <div className="card">
              <h2>输入可疑内容</h2>
              <textarea
                value={fraudText}
                onChange={(event) => {
                  setFraudText(event.target.value);
                  setFraudResult("none");
                }}
                placeholder="把短信、聊天内容或电话里听到的话写在这里。"
              />
              <div className="actions top-gap">
                <button className="btn primary" onClick={analyzeFraud}>
                  开始分析
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    setFraudText("客服说可以退款，但要我提供短信验证码，还让我赶紧转账验证。");
                    setFraudResult("none");
                  }}
                >
                  填入示例
                </button>
              </div>
            </div>
            {fraudResult !== "none" && (
              <div className={`result ${fraudResult === "high" ? "high" : ""}`}>
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
            <PageHeader title="家属端" desc="家属只查看授权范围内的信息，协助提醒和接收必要通知。" onBack={() => go("home")} />
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
            <PageHeader title="找家里人" desc="发送前会复述联系人和完整消息。" onBack={() => go("home")} />
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
            <PageHeader title="紧急求助" desc="如果胸口痛、摔倒、明显不舒服，请尽快联系身边人或急救服务。" onBack={() => go("home")} />
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

        <div className="footer-status">{status}</div>
          </main>
        </>
      )}
    </div>
  );
}

function PageHeader({ title, desc, onBack }: { title: string; desc: string; onBack: () => void }) {
  return (
    <div className="topbar">
      <div className="hello">
        <h1>{title}</h1>
        <p>{desc}</p>
      </div>
      <button className="btn" onClick={onBack}>
        返回首页
      </button>
    </div>
  );
}




