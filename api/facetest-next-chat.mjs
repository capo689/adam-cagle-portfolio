import {formatAdamContext, retrieveAdamKnowledge} from "./_facetest-knowledge.mjs";
import {facetestModelConfigured, facetestModelFetch} from "./_facetest-model.mjs";
import {
  ACE_SYSTEM_PROMPT,
  answerAudioPath,
  findAceStandardAnswer,
  formattedAceAnswer,
  guardAceRequest,
} from "./_ace-copy-system.mjs";
import {guardFacetestRequest} from "./_facetest-request-guard.mjs";

function reject(res, status, error, code) {
  res.status(status).json(code ? {error, code} : {error});
}

function cleanMessages(input) {
  if (!Array.isArray(input)) return [];
  return input.slice(-6).flatMap((message) => {
    const role = message?.role;
    const content = typeof message?.content === "string" ? message.content.trim().slice(0, 1200) : "";
    return (role === "user" || role === "assistant") && content ? [{role, content}] : [];
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return reject(res, 405, "POST required");
  if (!guardFacetestRequest(req, res, {limit: 28})) return;

  const messages = cleanMessages(req.body?.messages);
  if (!messages.length || messages.at(-1)?.role !== "user") return reject(res, 400, "A user message is required");

  const userText = messages.at(-1).content;
  const directAnswer = guardAceRequest(userText, messages, {enforceScope: false})
    || findAceStandardAnswer(userText)
    || guardAceRequest(userText, messages);
  if (directAnswer) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-FACETEST-Answer", "ace-standard");
    res.setHeader("X-FACETEST-Answer-Id", directAnswer.id);
    const audioPath = answerAudioPath(directAnswer);
    if (audioPath) res.setHeader("X-FACETEST-Audio", audioPath);
    res.write(formattedAceAnswer(directAnswer));
    return res.end();
  }
  if (!facetestModelConfigured()) return reject(res, 503, "FACETEST is not configured yet");
  const knowledge = retrieveAdamKnowledge(userText);
  const context = formatAdamContext(knowledge);
  let upstream;
  try {
    const result = await facetestModelFetch(
      [{role: "system", content: `${ACE_SYSTEM_PROMPT}\n\nRETRIEVED ADAM RECORDS:\n${context}`}, ...messages],
      {temperature: 0.58, maxTokens: 140}
    );
    upstream = result.response;
    res.setHeader("X-FACETEST-Provider", result.provider);
    res.setHeader("X-FACETEST-Model", result.model);
    if (result.groqSlot) res.setHeader("X-Groq-Key-Slot", result.groqSlot);
  } catch (error) {
    if (error?.code === "GROQ_QUOTA_EXHAUSTED") return reject(res, 429, "Groq credits are exhausted", error.code);
    return reject(res, 502, "FACETEST's model could not be reached");
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    console.error("FACETEST Next chat error", upstream.status, detail.slice(0, 1000));
    return reject(res, 502, "FACETEST could not generate a response");
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-FACETEST-Knowledge", String(knowledge.length));

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  try {
    for (;;) {
      const {done, value} = await reader.read();
      pending += decoder.decode(value || new Uint8Array(), {stream: !done});
      const lines = pending.split(/\r?\n/);
      pending = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6);
        if (data === "[DONE]") continue;
        try {
          const event = JSON.parse(data);
          const token = event.choices?.[0]?.delta?.content;
          if (typeof token === "string") res.write(token);
        } catch {}
      }
      if (done) break;
    }
  } catch (error) {
    console.error("FACETEST Next stream error", error);
  } finally {
    res.end();
  }
}
