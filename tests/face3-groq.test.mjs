import assert from "node:assert/strict";
import test from "node:test";

import chatHandler from "../api/face3-chat.mjs";
import speakHandler from "../api/face3-speak.mjs";
import transcribeHandler from "../api/face3-transcribe.mjs";

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
    end() { this.ended = true; }
  };
}

test("chat endpoint streams only assistant text", async () => {
  process.env.GROQ_API_KEY = "test-key";
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    const request = JSON.parse(options.body);
    assert.equal(request.model, "openai/gpt-oss-120b");
    assert.equal(request.messages.at(-1).content, "Hello");
    const stream = [
      'data: {"choices":[{"delta":{"content":"Hello "}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"there."}}]}\n\n',
      "data: [DONE]\n\n"
    ].join("");
    return new Response(stream, {status: 200, headers: {"Content-Type": "text/event-stream"}});
  };

  try {
    const req = {method: "POST", body: {messages: [{role: "user", content: "Hello"}]}};
    const res = mockResponse();
    await chatHandler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.chunks.join(""), "Hello there.");
    assert.equal(res.ended, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("transcription endpoint forwards browser audio", async () => {
  process.env.GROQ_API_KEY = "test-key";
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.body.get("model"), "whisper-large-v3-turbo");
    assert.equal(options.body.get("language"), "en");
    assert.ok(options.body.get("file") instanceof Blob);
    return new Response(JSON.stringify({text: "How are you?"}), {
      status: 200,
      headers: {"Content-Type": "application/json"}
    });
  };

  const audio = Buffer.alloc(1200, 1);
  const req = {
    method: "POST",
    headers: {"content-type": "audio/webm;codecs=opus"},
    async *[Symbol.asyncIterator]() { yield audio; }
  };

  try {
    const res = mockResponse();
    await transcribeHandler(req, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {text: "How are you?"});
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("speech endpoint forwards an allowed Orpheus voice and returns audio", async () => {
  process.env.GROQ_API_KEY = "test-key";
  const originalFetch = globalThis.fetch;
  const wav = new Uint8Array([82, 73, 70, 70, 1, 2, 3, 4]);
  globalThis.fetch = async (_url, options) => {
    const request = JSON.parse(options.body);
    assert.equal(request.model, "canopylabs/orpheus-v1-english");
    assert.equal(request.voice, "hannah");
    assert.equal(request.input, "Hello there.");
    return new Response(wav, {status: 200, headers: {"Content-Type": "audio/wav"}});
  };

  try {
    const req = {method: "POST", body: {text: "Hello there.", voice: "hannah"}};
    const res = mockResponse();
    res.send = function (body) { this.body = body; return this; };
    await speakHandler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers["content-type"], "audio/wav");
    assert.deepEqual(res.body, Buffer.from(wav));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("endpoints fail safely when the key is missing", async () => {
  delete process.env.GROQ_API_KEY;
  const chatRes = mockResponse();
  await chatHandler({method: "POST", body: {messages: [{role: "user", content: "Hi"}]}}, chatRes);
  assert.equal(chatRes.statusCode, 503);

  const transcriptionRes = mockResponse();
  await transcribeHandler({method: "POST", headers: {}, async *[Symbol.asyncIterator]() {}}, transcriptionRes);
  assert.equal(transcriptionRes.statusCode, 503);

  const speechRes = mockResponse();
  await speakHandler({method: "POST", body: {text: "Hi", voice: "daniel"}}, speechRes);
  assert.equal(speechRes.statusCode, 503);
});
