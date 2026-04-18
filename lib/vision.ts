import { getVisionAccessToken } from "./gcp-auth";

const VISION_URL = "https://vision.googleapis.com/v1/images:annotate";

function bytesToBase64(bytes: Uint8Array): string {
  // Chunked to avoid stack overflow on large images via ...spread in String.fromCharCode.
  let bin = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
  }
  return btoa(bin);
}

export async function detectDocumentText(imageBytes: Uint8Array, kv?: KVNamespace): Promise<string> {
  const token = await getVisionAccessToken(kv);
  const body = {
    requests: [
      {
        image: { content: bytesToBase64(imageBytes) },
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
