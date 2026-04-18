import { getVisionAccessToken } from "./gcp-auth";

const VISION_URL = "https://vision.googleapis.com/v1/images:annotate";

export async function detectDocumentText(imageBytes: Uint8Array, kv?: KVNamespace): Promise<string> {
  const token = await getVisionAccessToken(kv);
  const body = {
    requests: [
      {
        image: { content: btoa(String.fromCharCode(...imageBytes)) },
        features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
        imageContext: { languageHints: ["ko"] },
      },
    ],
  };
  const res = await fetch(VISION_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Vision API failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as {
    responses: Array<{ fullTextAnnotation?: { text?: string }; error?: { message?: string } }>;
  };
  const r = json.responses?.[0];
  if (r?.error?.message) throw new Error(`Vision API error: ${r.error.message}`);
  return r?.fullTextAnnotation?.text ?? "";
}
