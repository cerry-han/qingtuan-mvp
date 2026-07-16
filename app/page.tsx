"use client";

import { useMemo, useState } from "react";

type Page = "home" | "chat" | "reminders" | "fraud" | "family" | "help";
type ChatMessage = { role: "bot" | "user"; text: string };
type Reminder = { title: string; time: string; done: boolean };

const pageNames: Record<Page, string> = {
  home: "首页",
  chat: "对话陪伴",
  reminders: "提醒管理",
  fraud: "查诈骗风险",
  family: "找家里人",
  help: "紧急求助",
};

export default function Home() {
  const [page, setPage] = useState<Page>("home");
  const [status, setStatus] = useState("已准备好。");
  const [largeFont, setLargeFont] = useState(false);
  const [loudVolume, setLoudVolume] = useState(false);
  const [homeInput, setHomeInput] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [fraudText, setFraudText] = useState("");
  const [fraudResult, setFraudResult] = useState<"none" | "high" | "careful">("none");
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
  const [reminders, setReminders] = useState<Reminder[]>([
    { title: "吃降压药", time: "08:00", done: false },
    { title: "量血压", time: "15:00", done: false },
  ]);

  const appClass = useMemo(() => `app-shell${largeFont ? " large-font" : ""}`, [largeFont]);

  function go(next: Page) {
    setPage(next);
    setStatus(`已进入：${pageNames[next]}`);
  }

  function addChat(role: "bot" | "user", text: string) {
    setChat((items) => [...items, { role, text }]);
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
    setReminders((items) => items.map((item, idx) => (idx === index ? { ...item, done: true } : item)));
    setStatus(`已记录完成：${reminders[index].title}`);
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
    setReminderConfirm("");
    setReminderTitle("");
    setStatus("提醒已创建。");
  }

  function analyzeFraud() {
    if (!fraudText.trim()) {
      setStatus("请先输入要分析的内容。");
      return;
    }
    setFraudResult(/验证码|转账|银行卡|密码|退款|中奖|远程控制/.test(fraudText) ? "high" : "careful");
    setStatus("反诈骗分析已完成。");
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
      <aside className="side" aria-label="主导航">
        <div className="brand">
          <div className="logo">青</div>
          <span>青团智能体</span>
        </div>
        <nav className="nav">
          {(["home", "chat", "reminders", "fraud", "family", "help"] as Page[]).map((item) => (
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
                <button
                  className="btn feature"
                  onClick={() => {
                    go("chat");
                    addChat("bot", "办事指导演示：我会一次只讲一步。比如挂号，第一步是打开医院官方小程序或公众号。需要下一步时请说“下一步”。");
                  }}
                >
                  办事指导
                </button>
                <button className="btn feature" onClick={() => go("fraud")}>
                  查诈骗风险
                </button>
                <button
                  className="btn feature"
                  onClick={() => {
                    go("chat");
                    addChat("bot", "健康资料整理演示：第一版先做上传和摘要占位。正式版会加入 OCR 识别和复诊问题清单，但不会做诊断。");
                  }}
                >
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

        {page === "fraud" && (
          <section className="page active">
            <PageHeader title="查诈骗风险" desc="先暂停操作，不转账，不给验证码，再核实。" onBack={() => go("home")} />
            <div className="card">
              <h2>输入可疑内容</h2>
              <textarea value={fraudText} onChange={(event) => setFraudText(event.target.value)} placeholder="把短信、聊天内容或电话里听到的话写在这里。" />
              <div className="actions top-gap">
                <button className="btn primary" onClick={analyzeFraud}>
                  开始分析
                </button>
                <button className="btn" onClick={() => setFraudText("客服说可以退款，但要我提供短信验证码，还让我赶紧转账验证。")}>
                  填入示例
                </button>
              </div>
            </div>
            {fraudResult !== "none" && (
              <div className={`result ${fraudResult === "high" ? "high" : ""}`}>
                {fraudResult === "high" ? (
                  <>
                    <strong>风险等级：高</strong>
                    <br />
                    发现了索要验证码、诱导转账或冒充客服的风险。
                    <br />
                    建议：不要回复，不要转账，不要提供验证码。请联系家人或官方客服核实。
                    <div className="actions top-gap">
                      <button className="btn primary" onClick={() => go("family")}>
                        联系家人核实
                      </button>
                      <button className="btn" onClick={() => setStatus("记录已保存。")}>
                        保存记录
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <strong>风险等级：需谨慎</strong>
                    <br />
                    暂未发现明显高风险词，但仍建议通过官方渠道核实，不要轻易转账或透露个人信息。
                  </>
                )}
              </div>
            )}
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
