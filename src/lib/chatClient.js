// Talks to /api/chat and drives the tool loop: the model asks for a tool, the page runs it, the result goes back.
import { MAX_TOOL_ROUNDS } from './chatSpec.js';
import { runTool, pageContext } from './chatTools.js';

export class ChatError extends Error {
  constructor(kind, message) { super(message || kind); this.kind = kind; }
}

/** One request to the relay. Resolves with the model's final message; text arrives early through onText. */
async function callChat({ messages, context, signal, onText }) {
  let res;
  try {
    res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages, context }), signal });
  } catch (e) {
    if (e?.name === 'AbortError') throw e;
    throw new ChatError('network');
  }
  if (!res.ok) {
    let j = {};
    try { j = await res.json(); } catch { /* not JSON */ }
    throw new ChatError(j.error || 'upstream', j.message);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let final = null;
  const handle = (raw) => {
    let event = 'message';
    const data = [];
    for (const line of raw.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) data.push(line.slice(5).trim());
    }
    if (!data.length) return;
    let payload;
    try { payload = JSON.parse(data.join('\n')); } catch { return; }
    if (event === 'text') onText?.(payload.t);
    else if (event === 'done') final = payload;
    else if (event === 'error') throw new ChatError(payload.kind || 'upstream');
  };
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf('\n\n')) >= 0) { handle(buf.slice(0, i)); buf = buf.slice(i + 2); }
  }
  if (!final) throw new ChatError('upstream');
  return final;
}

/**
 * Runs one user message to completion (possibly several model <-> tool round trips).
 * `history` must end with the user's message. Returns the messages to append to the history and how it ended.
 * Nothing is returned on failure, so a half-finished tool exchange never gets stored.
 */
export async function runTurn({ history, app, signal, onText, onAction, onRound }) {
  const added = [];
  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    onRound?.();
    const { content, stop_reason: stop } = await callChat({ messages: [...history, ...added], context: pageContext(app), signal, onText });
    if (stop === 'refusal') return { added, outcome: 'refusal' };
    if (stop === 'max_tokens') { // a tool call cut off mid-input must never be stored or run
      const text = content.filter((b) => b.type === 'text');
      if (text.length) added.push({ role: 'assistant', content: text });
      return { added, outcome: 'max_tokens' };
    }
    if (content.length) added.push({ role: 'assistant', content });
    const uses = content.filter((b) => b.type === 'tool_use');
    if (stop !== 'tool_use' || !uses.length) return { added, outcome: stop === 'max_tokens' ? 'max_tokens' : content.length ? 'end' : 'empty' };
    const results = [];
    for (const u of uses) {
      const r = await runTool(u.name, u.input, app);
      if (r.label) onAction?.(r.label);
      results.push({ type: 'tool_result', tool_use_id: u.id, content: r.content, ...(r.isError ? { is_error: true } : {}) });
    }
    added.push({ role: 'user', content: results });
  }
  return { added, outcome: 'too_many_steps' };
}
