import assert from "node:assert/strict";
import test from "node:test";

import nextChatHandler from "../api/facetest-next-chat.mjs";
import {retrieveAdamKnowledge} from "../api/_facetest-knowledge.mjs";

function mockResponse() {
  return {
    statusCode: 200,
    headers: {},
    chunks: [],
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    json(body) { this.body = body; return this; },
    write(chunk) { this.chunks.push(String(chunk)); },
    end() { this.ended = true; }
  };
}

test("local Adam retrieval finds creator records without an embedding API", () => {
  const records = retrieveAdamKnowledge("Who created and designed this face?");
  assert.ok(records.length > 0);
  assert.match(records[0].text, /Adam Cagle created and designed/);
});

test("FACETEST Next injects retrieved knowledge and streams an expression cue", async () => {
  process.env.GROQ_API_KEY = "test-key";
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    const request = JSON.parse(options.body);
    assert.match(request.messages[0].content, /RETRIEVED ADAM RECORDS/);
    assert.match(request.messages[0].content, /Adam Cagle created and designed/);
    assert.match(request.messages[0].content, /\[\[face:EXPRESSION:INTENSITY\]\]/);
    return new Response('data: {"choices":[{"delta":{"content":"[[face:warm:0.7]]Hello."}}]}\n\ndata: [DONE]\n\n', {status: 200});
  };
  try {
    const res = mockResponse();
    await nextChatHandler({method: "POST", body: {messages: [{role: "user", content: "Who designed this face?"}]}}, res);
    assert.equal(res.chunks.join(""), "[[face:warm:0.7]]Hello.");
    assert.equal(res.headers["x-facetest-knowledge"], "1");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
