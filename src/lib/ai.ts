export interface IdiomInfo {
  word: string;
  pinyin: string;
  explanation: string;
  similar: string[];
  opposite: string[];
  usage: string;
  example: string;
}

export async function generateIdiomInfo(word: string): Promise<IdiomInfo> {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL || "https://api.deepseek.com";
  const model = process.env.AI_MODEL || "deepseek-chat";

  if (!apiKey || apiKey.includes("YOUR-AI-API-KEY")) {
    throw new Error("AI 接口未配置，请联系管理员");
  }

  const prompt = `请提供成语"${word}"的详细信息，返回严格的 JSON 格式，不要包含任何额外文字或 markdown 标记。JSON 结构如下：
{
  "word": "${word}",
  "pinyin": "拼音，带声调",
  "explanation": "成语释义，一句话即可",
  "similar": ["近义词1", "近义词2"],
  "opposite": ["反义词1", "反义词2"],
  "usage": "用法说明",
  "example": "一个例句"
}
如果该成语不存在或无法识别，返回 {"error": "not found"}。`;

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "你是一个汉语成语专家，熟悉所有成语的释义、用法和例句。" },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI 接口请求失败: ${response.status} ${errText}`);
  }

  const data = await response.json();
  let content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI 接口返回内容为空");
  }

  content = content.trim();
  if (content.startsWith("```")) {
    const match = content.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
    if (match) content = match[1].trim();
  }

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("AI 返回内容不是有效的 JSON");
  }

  if (parsed.error === "not found") {
    throw new Error(`未找到成语"${word}"，请检查输入是否正确`);
  }

  return {
    word: parsed.word || word,
    pinyin: parsed.pinyin || "",
    explanation: parsed.explanation || "",
    similar: Array.isArray(parsed.similar) ? parsed.similar : [],
    opposite: Array.isArray(parsed.opposite) ? parsed.opposite : [],
    usage: parsed.usage || "",
    example: parsed.example || "",
  };
}