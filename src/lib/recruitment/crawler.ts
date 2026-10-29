import * as cheerio from "cheerio";

export async function crawlRecruitmentPage(url: string): Promise<{
  title: string;
  content: string;
}> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    },
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`抓取失败: HTTP ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  $("script, style, noscript, iframe, svg, canvas").remove();

  let title =
    $("meta[property='og:title']").attr("content") ||
    $("title").text() ||
    "";
  title = title.trim();

  let content = "";

  const articleSelectors = [
    "article",
    ".article",
    ".article-content",
    ".content",
    ".main-content",
    "#content",
    ".post-content",
    ".detail-content",
    ".news-content",
    ".TRS_Editor",
    ".zoom",
  ];

  for (const selector of articleSelectors) {
    const $el = $(selector).first();
    if ($el.length && $el.text().trim().length > 100) {
      content = $el.text();
      break;
    }
  }

  if (!content) {
    content = $("body").text();
  }

  content = content
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (content.length > 15000) {
    content = content.slice(0, 15000);
  }

  return { title, content };
}