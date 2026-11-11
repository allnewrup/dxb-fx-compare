import React, { useCallback, useEffect, useRef, useState } from 'react';
import { runTurn, ChatError } from '../lib/chatClient.js';
import { MAX_USER_CHARS, MAX_BODY_BYTES } from '../lib/chatSpec.js';
import { Icon } from './ui.jsx';

const STORE = 'xd-chat-v1';
const SUGGESTIONS = [
  'Best rate for 1,000 USD to AED near Deira',
  'Compare the top 3 for sending 5,000 AED to India',
  'Banks open now in Sharjah',
  'What should I bring to exchange money?',
];
const ERRORS = {
  not_configured: "The assistant isn't switched on yet. The site owner still needs to add an Anthropic API key.",
  rate_limited: "You're sending messages quickly. Wait a minute and try again.",
  daily_limit: "The assistant has reached today's usage limit. Please try again tomorrow.",
  busy: 'The assistant is busy right now. Try again in a moment.',
  too_large: 'This conversation is too long. Start a new chat.',
  network: "Couldn't reach the assistant. Check your connection and try again.",
  upstream: 'The assistant ran into a problem. Please try again.',
};

function load() {
  try {
    const j = JSON.parse(sessionStorage.getItem(STORE) || 'null');
    if (j && Array.isArray(j.api) && Array.isArray(j.ui)) return j;
  } catch { /* private mode or corrupt */ }
  return { api: [], ui: [] };
}

/** Minimal formatter for the replies: "- " bullets and **bold**. Built from React nodes, never raw HTML. */
function Rich({ text }) {
  const inline = (t) => t.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part));
  const blocks = [];
  let list = null;
  text.split('\n').forEach((line, i) => {
    const m = line.match(/^\s*[-•*]\s+(.*)$/);
    if (m) {
      if (!list) { list = []; blocks.push({ list, key: i }); }
      list.push(m[1]);
    } else {
      list = null;
      if (line.trim()) blocks.push({ p: line, key: i });
    }
  });
  return (
    <div dir="auto" className="space-y-1.5">
      {blocks.map((b) => (b.list
        ? <ul key={b.key} className="list-disc space-y-0.5 pl-5">{b.list.map((li, j) => <li key={j}>{inline(li)}</li>)}</ul>
        : <p key={b.key}>{inline(b.p)}</p>))}
    </div>
  );
}

export default function ChatPanel({ app, open, onClose, offset = 0 }) {
  const [init] = useState(load);
  const [ui, setUi] = useState(init.ui); // [{role:'user'|'assistant'|'action'|'notice', text}]
  const apiRef = useRef(init.api); // what the model sees (full content blocks, including tool calls)
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const abortRef = useRef(null);
  const segRef = useRef(false); // is the last ui entry an assistant bubble still being written?
  const inputRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [ui, busy]);
  useEffect(() => { // keep the conversation for this tab; runs after busy flips so the model's history is included
    try { sessionStorage.setItem(STORE, JSON.stringify({ api: apiRef.current, ui })); } catch { /* ignore */ }
  }, [ui, busy]);

  const push = (entry) => { segRef.current = false; setUi((u) => [...u, entry]); };
  const append = (delta) => setUi((u) => {
    if (segRef.current && u[u.length - 1]?.role === 'assistant') return [...u.slice(0, -1), { ...u[u.length - 1], text: u[u.length - 1].text + delta }];
    segRef.current = true;
    return [...u, { role: 'assistant', text: delta }];
  });

  const send = useCallback(async (raw) => {
    const text = raw.trim();
    if (!text || busy) return;
    const userMsg = { role: 'user', content: [{ type: 'text', text }] };
    const history = [...apiRef.current, userMsg];
    if (JSON.stringify(history).length > MAX_BODY_BYTES * 0.8) {
      push({ role: 'notice', text: ERRORS.too_large });
      return;
    }
    setDraft('');
    push({ role: 'user', text });
    apiRef.current = history; // the question is remembered even if the answer fails
    setBusy(true);
    const ctl = new AbortController();
    abortRef.current = ctl;
    try {
      const { added, outcome } = await runTurn({
        history, app, signal: ctl.signal,
        onText: append,
        onAction: (label) => push({ role: 'action', text: label }),
        onRound: () => { segRef.current = false; },
      });
      apiRef.current = [...history, ...added];
      if (outcome === 'refusal') push({ role: 'notice', text: "I can't help with that one. Try asking about exchange rates or finding a branch." });
      else if (outcome === 'max_tokens') push({ role: 'notice', text: 'That answer was cut short. Ask me to continue, or ask a narrower question.' });
      else if (outcome === 'too_many_steps') push({ role: 'notice', text: 'That took more steps than I allow. The page shows where I got to; tell me what to change.' });
      else if (outcome === 'empty') push({ role: 'notice', text: 'I had nothing to add. Try rephrasing.' });
    } catch (e) {
      if (e?.name === 'AbortError') push({ role: 'notice', text: 'Stopped.' });
      else push({ role: 'notice', text: ERRORS[e instanceof ChatError ? e.kind : 'upstream'] ?? ERRORS.upstream });
    } finally {
      segRef.current = false;
      setBusy(false);
      abortRef.current = null;
    }
  }, [app, busy]); // eslint-disable-line react-hooks/exhaustive-deps

  const clear = () => {
    abortRef.current?.abort();
    apiRef.current = [];
    segRef.current = false;
    setUi([]);
    try { sessionStorage.removeItem(STORE); } catch { /* ignore */ }
    inputRef.current?.focus();
  };

  return (
    <section
      role="dialog" aria-label="Xchange assistant" aria-modal="false"
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      className="panel fixed right-3 z-50 flex w-[min(400px,calc(100vw-1.5rem))] flex-col overflow-hidden sm:right-5"
      style={{ bottom: offset + 80, height: `max(260px, min(620px, calc(100dvh - ${offset + 96}px)))` }}
    >
      <header className="flex items-center justify-between gap-2 border-b border-steel-300/70 px-3 py-2">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold uppercase leading-none tracking-wide">Ask Xchange</h2>
          <p className="truncate text-xs text-steel-600">AI assistant · uses Claude · rates are estimates</p>
        </div>
        <div className="flex items-center gap-1.5">
          {ui.length > 0 && <button type="button" className="btn btn-sm whitespace-nowrap" onClick={clear}>New chat</button>}
          <button type="button" className="btn btn-sm !px-2" onClick={onClose} aria-label="Close assistant"><Icon.close width="16" height="16" /></button>
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3 text-sm" aria-live="polite" aria-relevant="additions text">
        {ui.length === 0 && (
          <div className="space-y-3">
            <p className="text-steel-600">Tell me what you need and I'll set up the page for you: best rate, nearest branch, banks open now, or a side-by-side comparison. Any language works.</p>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((q) => <button key={q} type="button" className="key !justify-start text-left" onClick={() => send(q)}>{q}</button>)}
            </div>
          </div>
        )}
        {ui.map((m, i) => {
          if (m.role === 'user') return <div key={i} className="ml-8 rounded-2xl rounded-br-md bg-sky px-3 py-2 text-white shadow-raised" dir="auto">{m.text}</div>;
          if (m.role === 'assistant') return <div key={i} className="mr-6 rounded-2xl rounded-bl-md border border-steel-300/70 bg-white px-3 py-2 shadow-sm"><Rich text={m.text} /></div>;
          if (m.role === 'action') return <p key={i} className="mr-6 flex items-start gap-1.5 text-xs font-semibold text-go"><span aria-hidden="true">✓</span><span>{m.text}</span></p>;
          return <p key={i} role="status" className="rounded-lg border border-brass-400 bg-brass-200/60 px-3 py-2 text-xs text-brass-600">{m.text}</p>;
        })}
        {busy && <p className="text-xs text-steel-500" role="status">Working<span className="animate-pulse">…</span></p>}
        <div ref={endRef} />
      </div>

      <form
        className="flex items-end gap-2 border-t border-steel-300/70 p-2.5"
        onSubmit={(e) => { e.preventDefault(); send(draft); }}
      >
        <label htmlFor="chatInput" className="sr-only">Message to the assistant</label>
        <textarea
          id="chatInput" ref={inputRef} rows={1} maxLength={MAX_USER_CHARS} value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(draft); } }}
          placeholder="Ask, e.g. 500 EUR to AED"
          className="field max-h-28 min-h-[42px] resize-none py-2 text-base"
        />
        {busy
          ? <button type="button" className="btn h-[42px]" onClick={() => abortRef.current?.abort()}>Stop</button>
          : <button type="submit" className="btn btn-primary h-[42px]" disabled={!draft.trim()}>Send</button>}
      </form>
      <p className="px-3 pb-2 text-[11px] leading-snug text-steel-500">Messages go to Anthropic's Claude to produce answers and aren't stored by Xchange Desk. Don't share personal or financial details.</p>
    </section>
  );
}
