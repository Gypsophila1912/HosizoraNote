const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? "";

export async function summarizeNodes(treeText: string): Promise<string> {
  const prompt = `以下は思考ノートのツリー形式のメモです。
次の形式で日本語で出力してください。

【トピック】
・話題ごとに1行で端的に箇条書き（3〜5項目程度）

【まとめ】
全体を2〜4文で要約した文章。具体的なメッセージの引用や例示はせず、内容の概要だけを述べること。

${treeText}`;

  const res = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.status}`);
  }

  const json = await res.json();
  const text: string =
    json.candidates?.[0]?.content?.parts?.[0]?.text ??
    "要約を取得できませんでした";

  return text.trim();
}
