import { normalizeLatexForNotion } from "./latex-normalizer";

const clipboardPrototype = globalThis.Clipboard?.prototype;

if (clipboardPrototype) {
  patchWriteText(clipboardPrototype);
  patchWrite(clipboardPrototype);
  document.documentElement.dataset.notionLatexCopyVersion = "0.6.2";
}

function patchWriteText(prototype: Clipboard): void {
  const original = prototype.writeText;
  if (typeof original !== "function" || original.name === "notionLatexWriteText") {
    return;
  }

  Object.defineProperty(prototype, "writeText", {
    configurable: true,
    writable: true,
    value: async function notionLatexWriteText(this: Clipboard, text: string): Promise<void> {
      const result = normalizeLatexForNotion(text);
      const output = result.changed && result.mathCount > 0 ? result.text : text;
      await original.call(this, output);
      if (output !== text) {
        showCopyToast(result.mathCount);
      }
    }
  });
}

function patchWrite(prototype: Clipboard): void {
  const original = prototype.write;
  if (typeof original !== "function" || original.name === "notionLatexWrite") {
    return;
  }

  Object.defineProperty(prototype, "write", {
    configurable: true,
    writable: true,
    value: async function notionLatexWrite(this: Clipboard, items: ClipboardItem[]): Promise<void> {
      const convertedItems = await Promise.all(items.map(convertClipboardItem));
      return original.call(this, convertedItems);
    }
  });
}

async function convertClipboardItem(item: ClipboardItem): Promise<ClipboardItem> {
  if (!item.types.includes("text/plain")) {
    return item;
  }

  const plainBlob = await item.getType("text/plain");
  const plainText = await plainBlob.text();
  const result = normalizeLatexForNotion(plainText);
  if (!result.changed || result.mathCount === 0) {
    return item;
  }

  const entries: Record<string, Blob> = {};
  for (const type of item.types) {
    if (type === "text/plain") {
      entries[type] = new Blob([result.text], { type });
    } else {
      entries[type] = await item.getType(type);
    }
  }

  showCopyToast(result.mathCount);
  return new ClipboardItem(entries, { presentationStyle: item.presentationStyle });
}

function showCopyToast(mathCount: number): void {
  const existing = document.getElementById("notion-latex-copy-toast");
  existing?.remove();

  const toast = document.createElement("div");
  toast.id = "notion-latex-copy-toast";
  toast.textContent = `已整理 ${mathCount} 个公式，可直接粘贴到 Notion`;
  Object.assign(toast.style, {
    position: "fixed",
    right: "20px",
    bottom: "76px",
    zIndex: "2147483647",
    padding: "9px 12px",
    borderRadius: "7px",
    background: "#238636",
    color: "white",
    font: "13px -apple-system, BlinkMacSystemFont, sans-serif",
    boxShadow: "0 4px 18px rgba(0, 0, 0, 0.22)",
    pointerEvents: "none"
  });
  document.documentElement.appendChild(toast);
  window.setTimeout(() => toast.remove(), 2200);
}
