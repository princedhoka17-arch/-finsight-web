import { useState, useRef, useCallback } from "react";
import { ChatMessage } from "@/types";
import { supabase } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function useChat(reportId: string, companyName: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hi! I have read the full ${companyName} report. Ask me anything about it — financials, risks, growth, or what any term means.`,
      timestamp: new Date(),
    },
  ]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim() || loading) return;

      const userMsg: ChatMessage = {
        id:        Date.now().toString(),
        role:      "user",
        content:   userMessage.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);
      setError(null);

      const aiMsgId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        { id: aiMsgId, role: "assistant", content: "", timestamp: new Date() },
      ]);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Not authenticated");

        abortRef.current?.abort();
        abortRef.current = new AbortController();

        // FIX 1: URL is POST /chat — not /chat/:reportId
        // FIX 2: body is { report_id, message, session_id? }
        //        Backend does NOT take a history array — RAG handles context.
        const response = await fetch(`${API_URL}/chat`, {
          method: "POST",
          headers: {
            "Content-Type":  "application/json",
            Authorization:   `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            report_id:  reportId,
            message:    userMessage.trim(),
            session_id: sessionId ?? undefined,
          }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.detail || `Error ${response.status}`);
        }

        const reader      = response.body!.getReader();
        const decoder     = new TextDecoder();
        let accumulated   = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") break;

            try {
              const parsed = JSON.parse(data);

              // Capture session_id so follow-up messages share RAG context
              if (parsed.type === "session" && parsed.session_id) {
                setSessionId(parsed.session_id);
              }

              if (parsed.type === "text" && parsed.content) {
                accumulated += parsed.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMsgId ? { ...m, content: accumulated } : m
                  )
                );
              }

              if (parsed.type === "error") throw new Error(parsed.message);
            } catch {
              // Ignore JSON parse errors from partial SSE chunks
            }
          }
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;

        const errorMsg = err.message?.includes("429")
          ? "You have reached the question limit for this report. Upgrade your plan to ask more."
          : err.message || "Something went wrong. Please try again.";

        setError(errorMsg);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? { ...m, content: "Sorry, I could not answer that. " + errorMsg }
              : m
          )
        );
      } finally {
        setLoading(false);
      }
    },
    [reportId, sessionId, loading]
  );

  function clearMessages() {
    setMessages([
      {
        id:        "welcome",
        role:      "assistant",
        content:   `Hi! I have read the full ${companyName} report. Ask me anything about it.`,
        timestamp: new Date(),
      },
    ]);
    setSessionId(null);
  }

  function cancelStream() {
    abortRef.current?.abort();
    setLoading(false);
  }

  return {
    messages,
    loading,
    error,
    sessionId,
    sendMessage,
    clearMessages,
    cancelStream,
  };
}