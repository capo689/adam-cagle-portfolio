import assert from "node:assert/strict";
import test from "node:test";

import chatHandler from "../api/facetest-chat.mjs";
import nextChatHandler from "../api/facetest-next-chat.mjs";
import speakHandler from "../api/facetest-speak.mjs";
import {groqFetch} from "../api/_groq-failover.mjs";

function mockResponse() {
  return {
    statusCode: 200,
    headers: {},
    chunks: [],
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    json(body) { this.body = body; return this; },
    write(chunk) { this.chunks.push(String(chunk)); },
    end() { this.ended = true; },
    send(body) { this.body = body; return this; }
  };
}

test("FACETEST chat knows Adam Cagle created the face", async () => {
  process.env.GROQ_API_KEY = "test-key";
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    const request = JSON.parse(options.body);
    assert.match(request.messages[0].content, /created by Adam Cagle/);
    assert.match(request.messages[0].content, /voice is Troy/);
    return new Response('data: {"choices":[{"delta":{"content":"Hello."}}]}\n\ndata: [DONE]\n\n', {status: 200});
  };
  try {
    const res = mockResponse();
    await chatHandler({method: "POST", body: {messages: [{role: "user", content: "Who made you?"}]}}, res);
    assert.equal(res.chunks.join(""), "Hello.");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("FACETEST speech is locked to Troy server-side", async () => {
  process.env.GROQ_API_KEY = "test-key";
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    const request = JSON.parse(options.body);
    assert.equal(request.voice, "troy");
    assert.equal(request.model, "canopylabs/orpheus-v1-english");
    return new Response(new Uint8Array([82, 73, 70, 70]), {status: 200, headers: {"Content-Type": "audio/wav"}});
  };
  try {
    const res = mockResponse();
    await speakHandler({method: "POST", body: {text: "Hello.", voice: "daniel"}}, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers["content-type"], "audio/wav");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Groq tries the primary key before the backup key", async () => {
  process.env.GROQ_API_KEY = "primary-key";
  process.env.GROQ_API_KEY_BACKUP = "backup-key";
  const originalFetch = globalThis.fetch;
  const authorizations = [];
  globalThis.fetch = async (_url, options) => {
    authorizations.push(new Headers(options.headers).get("authorization"));
    return authorizations.length === 1 ? new Response("quota", {status: 429}) : new Response("ok", {status: 200});
  };
  try {
    const result = await groqFetch("https://api.groq.test", {method: "POST", body: "test"});
    assert.equal(await result.response.text(), "ok");
    assert.equal(result.slot, "backup");
    assert.equal(result.allQuotaExhausted, false);
    assert.deepEqual(authorizations, ["Bearer primary-key", "Bearer backup-key"]);
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.GROQ_API_KEY_BACKUP;
  }
});

test("Groq authentication errors remain visible and do not rotate keys", async () => {
  process.env.GROQ_API_KEY = "primary-key";
  process.env.GROQ_API_KEY_BACKUP = "backup-key";
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response("unauthorized", {status: 401}); };
  try {
    const result = await groqFetch("https://api.groq.test", {method: "POST"});
    assert.equal(result.response.status, 401);
    assert.equal(result.slot, "primary");
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.GROQ_API_KEY_BACKUP;
  }
});

test("Groq identifies quota exhaustion only after both keys reject usage", async () => {
  process.env.GROQ_API_KEY = "primary-key";
  process.env.GROQ_API_KEY_BACKUP = "backup-key";
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("quota", {status: 429});
  try {
    const result = await groqFetch("https://api.groq.test", {method: "POST"});
    assert.equal(result.slot, "backup");
    assert.equal(result.allQuotaExhausted, true);
    assert.deepEqual(result.attempts, [
      {slot: "primary", status: 429},
      {slot: "backup", status: 429}
    ]);
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.GROQ_API_KEY_BACKUP;
  }
});

test("FACETEST Next returns a stable quota code when both keys are exhausted", async () => {
  process.env.GROQ_API_KEY = "primary-key";
  process.env.GROQ_API_KEY_BACKUP = "backup-key";
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("quota", {status: 429});
  try {
    const res = mockResponse();
    await nextChatHandler({method: "POST", body: {messages: [{role: "user", content: "Hello"}]}}, res);
    assert.equal(res.statusCode, 429);
    assert.equal(res.body.code, "GROQ_QUOTA_EXHAUSTED");
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.GROQ_API_KEY_BACKUP;
  }
});

test("FACETEST Next uses the lean Groq model and bounded request context", async () => {
  process.env.GROQ_API_KEY = "primary-key";
  delete process.env.GROQ_API_KEY_BACKUP;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    const request = JSON.parse(options.body);
    assert.equal(request.model, "llama-3.1-8b-instant");
    assert.equal(request.max_completion_tokens, 160);
    assert.ok(request.messages.length <= 7);
    assert.equal("reasoning_effort" in request, false);
    return new Response('data: {"choices":[{"delta":{"content":"[[face:warm:0.5]]Hello."}}]}\n\ndata: [DONE]\n\n', {status: 200});
  };
  try {
    const messages = Array.from({length: 14}, (_, index) => ({role: index % 2 ? "assistant" : "user", content: `message ${index}`}));
    messages.at(-1).role = "user";
    const res = mockResponse();
    await nextChatHandler({method: "POST", body: {messages}}, res);
    assert.match(res.chunks.join(""), /Hello/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("FACETEST Next answers exact Adam FAQs without spending Groq tokens", async () => {
  delete process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEY_BACKUP;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("Groq should not be called"); };
  try {
    const res = mockResponse();
    await nextChatHandler({method: "POST", body: {messages: [{role: "user", content: "Where is Adam based?"}]}}, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers["x-facetest-answer"], "local-faq");
    assert.match(res.chunks.join(""), /Bend, Oregon/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
