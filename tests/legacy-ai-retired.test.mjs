import assert from "node:assert/strict";
import test from "node:test";

const RETIRED_ENDPOINTS = [
  "face2-chat",
  "face2-transcribe",
  "face3-chat",
  "face3-speak",
  "face3-transcribe",
  "facetest-chat",
  "facetest-fish-speak",
  "facetest-fish-stream-speak",
  "facetest-next-chat",
  "facetest-speak",
  "facetest-transcribe",
  "facetest-voxtral-speak",
];

function mockResponse() {
  return {
    headers: {},
    statusCode: 200,
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

for (const endpoint of RETIRED_ENDPOINTS) {
  test(`${endpoint} fails closed without contacting a provider`, async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      throw new Error("A retired endpoint attempted an outbound request");
    };

    try {
      const {default: handler} = await import(`../api/${endpoint}.mjs`);
      const response = mockResponse();
      await handler({method: "POST"}, response);

      assert.equal(response.statusCode, 410);
      assert.equal(response.body?.code, "LEGACY_AI_RETIRED");
      assert.match(response.headers["cache-control"], /no-store/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
}
