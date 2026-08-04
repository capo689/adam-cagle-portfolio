import assert from "node:assert/strict";
import test from "node:test";

import chatHandler from "../api/facetest-chat.mjs";
import speakHandler from "../api/facetest-speak.mjs";

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
