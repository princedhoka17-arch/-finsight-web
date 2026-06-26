"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatMessage } from "@/types";

interface AIChatPanelProps {
  reportId: string;
  companyName: string;
  questionsAllowed: number | -1; // -1 = unlimited
  theme: any;
}

const SUGGESTED_QUESTIONS = [
  "How does this company make money?",
  "What are the biggest risks?",
  "Is the debt level safe?",
  "What does the growth look like?",
];

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AIChatPanel({
  reportId,
  companyName,
  questionsAllowed,
  theme,
}: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "0",
      role: "assistant",
      content: `Hi! I've read the full report for ${companyName}. Ask me anything about it — financials, risks, growth, or what any term means.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questionsLeft, setQuestionsLeft] = useState(
    questionsAllowed === -1 ? Infinity : questionsAllowed
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isLocked = questionsAllowed === 0;
  const isUnlimited = questionsAllowed === -1;

  async function sendMessage(text?: string) {
    const question = text ?? input.trim();
    if (!question || loading || questionsLeft === 0) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // TODO: wire to /api/chat route
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_id: reportId,
          message: question,
          session_id: sessionId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to get response");
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      if (data.session_id) setSessionId(data.session_id);
      if (!isUnlimited) {
        setQuestionsLeft((q) => Math.max(0, (q as number) - 1));
      }
    } catch {
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I couldn't process that. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      background: theme.bgSecondary,
      border: `1px solid ${theme.border}`,
      borderRadius: "12px",
      display: "flex",
      flexDirection: "column",
      height: "520px",
      fontFamily: "Georgia, serif",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 20px",
        borderBottom: `1px solid ${theme.border}`,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexShrink: 0,
      }}>
        <span style={{ fontSize: "16px" }}>🤖</span>
        <div style={{ flex: 1 }}>
          <p style={{
            fontFamily: "Courier New, monospace", fontSize: "11px",
            letterSpacing: "0.1em", textTransform: "uppercase" as const,
            color: theme.accent, margin: 0,
          }}>
            AI Assistant
          </p>
          <p style={{
            fontFamily: "Georgia, serif", fontSize: "12px",
            color: theme.textMuted, margin: 0,
          }}>
            {companyName}
          </p>
        </div>
        {isLocked ? (
          <span style={{
            fontFamily: "Courier New, monospace", fontSize: "9px",
            letterSpacing: "0.08em", textTransform: "uppercase" as const,
            color: theme.info, background: `${theme.info}15`,
            border: `1px solid ${theme.info}30`,
            padding: "3px 8px", borderRadius: "3px",
          }}>
            Upgrade to unlock
          </span>
        ) : (
          <span style={{
            fontFamily: "Courier New, monospace", fontSize: "10px",
            color: theme.textFaint,
          }}>
            {isUnlimited ? "Unlimited" : `${questionsLeft} left`}
          </span>
        )}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "16px",
        display: "flex", flexDirection: "column", gap: "12px",
      }}>
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div key={m.id} style={{
              display: "flex",
              justifyContent: isUser ? "flex-end" : "flex-start",
              gap: "10px",
              alignItems: "flex-start",
            }}>
              {!isUser && (
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  background: `${theme.accent}18`,
                  border: `1px solid ${theme.accent}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "Courier New, monospace", fontSize: "9px",
                  fontWeight: 700, color: theme.accent, flexShrink: 0,
                }}>
                  AI
                </div>
              )}
              <div style={{
                maxWidth: "75%",
                background: isUser ? `${theme.accent}15` : `${theme.border}40`,
                border: `1px solid ${isUser ? `${theme.accent}30` : theme.border}`,
                borderRadius: isUser ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                padding: "10px 14px",
              }}>
                <p style={{
                  fontFamily: "Georgia, serif", fontSize: "13px",
                  color: theme.text, lineHeight: 1.6, margin: "0 0 4px",
                }}>
                  {m.content}
                </p>
                <p style={{
                  fontFamily: "Courier New, monospace", fontSize: "10px",
                  color: theme.textFaint, margin: 0,
                  textAlign: isUser ? "right" : "left",
                }}>
                  {formatTime(new Date(m.timestamp))}
                </p>
              </div>
              {isUser && (
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  background: `${theme.info}18`,
                  border: `1px solid ${theme.info}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "Courier New, monospace", fontSize: "9px",
                  fontWeight: 700, color: theme.info, flexShrink: 0,
                }}>
                  You
                </div>
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%",
              background: `${theme.accent}18`, border: `1px solid ${theme.accent}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "Courier New, monospace", fontSize: "9px",
              fontWeight: 700, color: theme.accent, flexShrink: 0,
            }}>AI</div>
            <div style={{
              background: `${theme.border}40`, border: `1px solid ${theme.border}`,
              borderRadius: "12px 12px 12px 2px", padding: "12px 16px",
              display: "flex", gap: "4px", alignItems: "center",
            }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: "6px", height: "6px", borderRadius: "50%",
                  background: theme.accent, opacity: 0.6,
                  animation: `bounce 0.8s ${i * 0.15}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested questions */}
      {messages.length <= 1 && !isLocked && (
        <div style={{
          padding: "0 16px 12px",
          display: "flex", flexWrap: "wrap" as const, gap: "6px", flexShrink: 0,
        }}>
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              style={{
                fontFamily: "Courier New, monospace", fontSize: "11px",
                letterSpacing: "0.03em", color: theme.textMuted,
                background: `${theme.border}40`,
                border: `1px solid ${theme.border}`,
                borderRadius: "4px", padding: "5px 10px",
                cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = theme.accent;
                (e.currentTarget as HTMLElement).style.borderColor = `${theme.accent}40`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = theme.textMuted;
                (e.currentTarget as HTMLElement).style.borderColor = theme.border;
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input or locked state */}
      {isLocked ? (
        <div style={{
          padding: "14px 16px",
          borderTop: `1px solid ${theme.border}`,
          display: "flex", alignItems: "center",
          gap: "12px", flexShrink: 0,
        }}>
          <p style={{
            fontFamily: "Georgia, serif", fontSize: "13px",
            color: theme.textMuted, margin: 0, flex: 1,
          }}>
            Upgrade your plan to ask AI questions about this report.
          </p>
          <a href="/subscribe" style={{
            background: `${theme.accent}15`, color: theme.accent,
            border: `1px solid ${theme.accent}30`, borderRadius: "6px",
            padding: "8px 14px", fontFamily: "Courier New, monospace",
            fontSize: "12px", cursor: "pointer", textDecoration: "none",
            whiteSpace: "nowrap" as const, letterSpacing: "0.04em",
          }}>
            Upgrade →
          </a>
        </div>
      ) : (
        <div style={{
          padding: "12px 16px",
          borderTop: `1px solid ${theme.border}`,
          display: "flex", gap: "8px", flexShrink: 0,
        }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder={
              questionsLeft === 0
                ? "No questions remaining"
                : `Ask about ${companyName}…`
            }
            disabled={loading || questionsLeft === 0}
            style={{
              flex: 1, background: theme.bg,
              border: `1px solid ${theme.border}`,
              borderRadius: "8px", padding: "10px 14px",
              fontFamily: "Georgia, serif", fontSize: "13px",
              color: theme.text, outline: "none",
              opacity: questionsLeft === 0 ? 0.5 : 1,
            }}
            onFocus={(e) => {
              (e.target as HTMLElement).style.borderColor = `${theme.accent}80`;
            }}
            onBlur={(e) => {
              (e.target as HTMLElement).style.borderColor = theme.border;
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim() || questionsLeft === 0}
            style={{
              background: theme.accent, border: "none",
              borderRadius: "8px", color: theme.accentText,
              padding: "10px 18px", fontFamily: "Courier New, monospace",
              fontSize: "12px", cursor: "pointer", letterSpacing: "0.04em",
              opacity: loading || !input.trim() || questionsLeft === 0 ? 0.5 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {loading ? "…" : "Send"}
          </button>
        </div>
      )}

      {/* Legal */}
      <p style={{
        fontFamily: "Courier New, monospace", fontSize: "10px",
        color: theme.textFaint, textAlign: "center",
        margin: 0, padding: "6px 16px 10px", flexShrink: 0,
        letterSpacing: "0.04em",
      }}>
        AI responses are for educational purposes only. Not financial advice.
      </p>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}