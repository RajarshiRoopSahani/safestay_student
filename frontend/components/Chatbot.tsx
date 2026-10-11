"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Navigation, Send, Trash2, UserRound } from "lucide-react";
import { getErrorMessage } from "@/services/api";
import { clearChatHistory, fetchChatHistory, sendChat } from "@/services/aiService";
import { ChatMessage } from "@/types";
import { formatRent, PROPERTY_TYPE_LABEL } from "@/utils/format";

const SUGGESTIONS = [
  "Find a PG under ₹7000 with Wi-Fi",
  "Show rooms under ₹6000",
  "Which properties have Wi-Fi and meals?",
  "Compare Student Heights and Campus View PG",
  "What should I check before booking a PG?",
];

export default function Chatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disclaimer, setDisclaimer] = useState(
    "SafeStay AI can make mistakes. Please verify details and visit the property before booking."
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChatHistory()
      .then(setMessages)
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending, loadingHistory]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || sending) return;

    setError(null);
    setInput("");
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content: message }]);
    setSending(true);

    try {
      const res = await sendChat(message);
      setDisclaimer(res.disclaimer);
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", content: res.reply, properties: res.properties },
      ]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  async function handleClear() {
    if (!window.confirm("Clear your chat history?")) return;
    try {
      await clearChatHistory();
      setMessages([]);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  return (
    <div className="flex h-[72vh] min-h-[460px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-indigo-100 p-2 text-indigo-600">
            <Bot className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">SafeStay AI</p>
            <p className="text-xs text-slate-500">Answers from real listings</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear chat
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {loadingHistory ? (
          <div className="flex justify-center py-10 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="mx-auto max-w-md py-8 text-center">
            <Bot className="mx-auto h-10 w-10 text-indigo-500" />
            <h2 className="mt-3 text-base font-semibold text-slate-900">Ask me about student accommodation</h2>
            <p className="mt-1 text-sm text-slate-500">Try one of these, or type your own question.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <span
                className={`mt-1 h-8 w-8 shrink-0 rounded-full p-1.5 ${
                  m.role === "user" ? "bg-slate-200 text-slate-600" : "bg-indigo-100 text-indigo-600"
                }`}
              >
                {m.role === "user" ? <UserRound className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
              </span>
              <div className={`max-w-[85%] ${m.role === "user" ? "text-right" : ""}`}>
                <div
                  className={`inline-block whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-left text-sm ${
                    m.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {m.content}
                </div>

                {m.properties && m.properties.length > 0 && (
                  <div className="mt-2 grid gap-2 text-left sm:grid-cols-2">
                    {m.properties.map((p) => (
                      <Link
                        key={p.id}
                        href={`/property/${p.id}`}
                        className="rounded-xl border border-slate-200 bg-white p-3 transition hover:border-indigo-300 hover:shadow"
                      >
                        <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                        <p className="text-xs text-slate-500">
                          {PROPERTY_TYPE_LABEL[p.type]} · {p.area}
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {formatRent(p.rent)}
                          <span className="text-xs font-normal text-slate-500">/month</span>
                        </p>
                        <p className="text-xs text-slate-500">{p.ratingNote}</p>
                        {(p.distanceKm !== null || p.nearestCollege) && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-600">
                            <Navigation className="h-3 w-3 text-indigo-500" />
                            {p.distanceKm !== null
                              ? `${p.distanceKm} km away`
                              : `${p.nearestCollege!.distanceKm} km from ${p.nearestCollege!.name}`}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {sending && (
          <div className="flex items-center gap-3">
            <span className="h-8 w-8 rounded-full bg-indigo-100 p-1.5 text-indigo-600">
              <Bot className="h-5 w-5" />
            </span>
            <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2.5 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Thinking...
            </div>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="border-t border-slate-200 p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={500}
            disabled={sending}
            placeholder="Ask about rent, ratings, distance, facilities..."
            aria-label="Message SafeStay AI"
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
          />
          <button
            onClick={() => send(input)}
            disabled={sending || !input.trim()}
            aria-label="Send message"
            className="rounded-xl bg-indigo-600 p-3 text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-slate-400">{disclaimer}</p>
      </div>
    </div>
  );
}
