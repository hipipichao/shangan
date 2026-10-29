import PDFDocument from "pdfkit";

export interface PdfIdiomItem {
  word: string;
  pinyin?: string;
  explanation?: string;
  similar?: string[];
  opposite?: string[];
  count: number;
}

const FONT_REGULAR =
  process.env.IDIOM_FONT_REGULAR || "C:\\Windows\\Fonts\\Deng.ttf";
const FONT_BOLD = process.env.IDIOM_FONT_BOLD || "C:\\Windows\\Fonts\\simhei.ttf";

const COLORS = {
  text: "#111827",
  muted: "#6b7280",
  line: "#e5e7eb",
  high: "#b91c1c",
  mid: "#b45309",
  low: "#1d4ed8",
  rare: "#6b7280",
  similar: "#059669",
  opposite: "#e11d48",
  title: "#111827",
};

function countTier(count: number) {
  if (count >= 50) return { label: "高频", color: COLORS.high };
  if (count >= 20) return { label: "中频", color: COLORS.mid };
  if (count >= 10) return { label: "低频", color: COLORS.low };
  return { label: "罕见", color: COLORS.rare };
}

export function createIdiomPdfDoc(
  idioms: PdfIdiomItem[]
): PDFKit.PDFDocument {
  const doc = new PDFDocument({
    size: "A4",
    margin: 40,
    bufferPages: true,
  });

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const margin = doc.page.margins;
  const contentWidth = pageWidth - margin.left - margin.right;
  const headerBottom = 42;
  const usableTop = headerBottom + 8;
  const usableBottom = pageHeight - margin.bottom;

  doc.registerFont("regular", FONT_REGULAR);
  doc.registerFont("bold", FONT_BOLD);

  let y = usableTop;

  function ensureSpace(needed: number) {
    if (y + needed > usableBottom) {
      doc.addPage();
      y = usableTop;
    }
  }

  function drawHeader() {
    doc.font("bold").fontSize(16).fillColor(COLORS.title);
    doc.text("公考成语词频背诵表", margin.left, y, {
      width: contentWidth,
      align: "center",
    });
    y += doc.heightOfString("公考成语词频背诵表", { width: contentWidth });
    doc.font("regular").fontSize(9).fillColor(COLORS.muted);
    const sub = `共 ${idioms.length} 条 · 按出现频次降序排列`;
    doc.text(sub, margin.left, y, { width: contentWidth, align: "center" });
    y += doc.heightOfString(sub, { width: contentWidth }) + 8;
    doc.strokeColor(COLORS.line).lineWidth(0.5);
    doc.moveTo(margin.left, y).lineTo(margin.left + contentWidth, y).stroke();
    y += 6;
  }

  function drawSiteHeader() {
    doc.save();
    doc.font("regular").fontSize(9).fillColor(COLORS.muted);
    doc.text("岸上见 · AI 公考备考助手", margin.left, 16, { lineBreak: false });
    const siteUrl = "https://exam.webot.eu.org/";
    const urlWidth = doc.widthOfString(siteUrl);
    doc.text(siteUrl, pageWidth - margin.right - urlWidth, 16, { lineBreak: false });
    doc.strokeColor(COLORS.line).lineWidth(0.5);
    doc.moveTo(margin.left, headerBottom).lineTo(pageWidth - margin.right, headerBottom).stroke();
    doc.restore();
  }

  drawHeader();

  const rankWidth = 28;
  const gap = 6;
  const bodyX = margin.left + rankWidth + gap;
  const bodyWidth = contentWidth - rankWidth - gap;

  idioms.forEach((idiom, idx) => {
    const rank = idx + 1;
    const tier = countTier(idiom.count);

    const firstLineHeight = 14;
    let blockHeight = firstLineHeight;

    doc.font("regular").fontSize(9);
    if (idiom.explanation) {
      const expH = doc.heightOfString(idiom.explanation, { width: bodyWidth });
      blockHeight += expH + 2;
    }

    let metaLine = "";
    if (idiom.similar && idiom.similar.length) {
      metaLine += `近义：${idiom.similar.join("、")}  `;
    }
    if (idiom.opposite && idiom.opposite.length) {
      metaLine += `反义：${idiom.opposite.join("、")}`;
    }
    metaLine = metaLine.trim();
    if (metaLine) {
      doc.fontSize(8);
      const metaH = doc.heightOfString(metaLine, { width: bodyWidth });
      blockHeight += metaH + 2;
    }
    blockHeight += 4;

    ensureSpace(blockHeight);

    doc.font("regular").fontSize(9).fillColor(COLORS.muted);
    doc.text(String(rank), margin.left, y + 1, {
      width: rankWidth,
      align: "right",
    });

    let cursorX = bodyX;

    doc.font("bold").fontSize(11).fillColor(COLORS.text);
    const wordWidth = doc.widthOfString(idiom.word);
    doc.text(idiom.word, cursorX, y);
    cursorX += wordWidth + 4;

    if (idiom.pinyin) {
      doc.font("regular").fontSize(8).fillColor(COLORS.muted);
      const pyWidth = doc.widthOfString(idiom.pinyin);
      doc.text(idiom.pinyin, cursorX, y + 3);
      cursorX += pyWidth + 6;
    }

    doc.font("regular").fontSize(8).fillColor(tier.color);
    doc.text(`${idiom.count}次`, cursorX, y + 3);

    y += firstLineHeight;

    if (idiom.explanation) {
      doc.font("regular").fontSize(9).fillColor(COLORS.text);
      const expH = doc.heightOfString(idiom.explanation, { width: bodyWidth });
      doc.text(idiom.explanation, bodyX, y, { width: bodyWidth });
      y += expH + 2;
    }

    if (metaLine) {
      doc.font("regular").fontSize(8);
      const hasSimilar = idiom.similar && idiom.similar.length;
      const hasOpposite = idiom.opposite && idiom.opposite.length;

      doc.fillColor(COLORS.similar);
      if (hasSimilar && hasOpposite) {
        doc.text(`近义：${idiom.similar!.join("、")}  `, bodyX, y, {
          width: bodyWidth,
          continued: true,
        });
        doc.fillColor(COLORS.opposite);
        doc.text(`反义：${idiom.opposite!.join("、")}`, { width: bodyWidth });
      } else if (hasSimilar) {
        doc.text(`近义：${idiom.similar!.join("、")}`, bodyX, y, {
          width: bodyWidth,
        });
      } else if (hasOpposite) {
        doc.fillColor(COLORS.opposite);
        doc.text(`反义：${idiom.opposite!.join("、")}`, bodyX, y, {
          width: bodyWidth,
        });
      }
      const metaH = doc.heightOfString(metaLine, { width: bodyWidth });
      y += metaH + 2;
    }

    y += 4;

    doc.strokeColor(COLORS.line).lineWidth(0.3);
    doc.moveTo(margin.left, y).lineTo(margin.left + contentWidth, y).stroke();
    y += 4;
  });

  const { start, count: totalPages } = doc.bufferedPageRange();
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(start + i);
    drawSiteHeader();
    doc.font("regular").fontSize(9).fillColor(COLORS.muted);
    const pageNumText = `第 ${i + 1} 页 / 共 ${totalPages} 页`;
    const textWidth = doc.widthOfString(pageNumText);
    doc.text(pageNumText, (pageWidth - textWidth) / 2, pageHeight - margin.bottom + 16, {
      lineBreak: false,
    });
  }

  doc.end();

  return doc;
}