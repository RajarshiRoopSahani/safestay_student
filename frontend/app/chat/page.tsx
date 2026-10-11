"use client";

import Chatbot from "@/components/Chatbot";
import RequireAuth from "@/components/RequireAuth";

export default function ChatPage() {
  return (
    <RequireAuth>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">SafeStay AI</h1>
        <p className="mb-5 mt-1 text-sm text-slate-500">
          Ask about rent, ratings, distance and facilities. Answers are based on the properties listed on SafeStay.
        </p>
        <Chatbot />
      </div>
    </RequireAuth>
  );
}
