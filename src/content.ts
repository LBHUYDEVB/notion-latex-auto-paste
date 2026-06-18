import { normalizeLatexForNotion } from "./latex-normalizer";
import { buildNotionPastePlan, findMarkerTextSpan, type FormulaPlaceholder } from "./notion-paste-segments";

let redispatchingPaste = false;

document.documentElement.dataset.notionLatexPasteVersion = "0.6.2";

window.addEventListener(
  "paste",
  (event) => {
    if (redispatchingPaste || !event.clipboardData) {
      return;
    }

    const originalText = event.clipboardData.getData("text/plain");
    if (!originalText) {
      return;
    }

    const result = normalizeLatexForNotion(originalText);
    if (result.mathCount === 0) {
      return;
    }

    const target = getDispatchTarget(event);
    if (!target) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    const plan = buildNotionPastePlan(result.text);
    void pasteWithFormulaPlaceholders(target, plan.text, plan.formulas);
  },
  true
);

function getDispatchTarget(event: ClipboardEvent): Element | null {
  const pathTarget = event.composedPath()[0];
  if (pathTarget instanceof Element) {
    return pathTarget;
  }
  return event.target instanceof Element ? event.target : document.activeElement;
}

function insertPlainTextFallback(text: string): void {
  // execCommand keeps contenteditable frameworks in sync better than direct DOM mutation.
  document.execCommand("insertText", false, text);
}

async function pasteWithFormulaPlaceholders(
  initialTarget: Element,
  placeholderText: string,
  formulas: FormulaPlaceholder[]
): Promise<void> {
  redispatchingPaste = true;
  let convertedCount = 0;
  try {
    dispatchPlainTextPaste(initialTarget, placeholderText);
    await waitForInitialPaste(formulas);

    for (const formula of formulas) {
      try {
        const target = await selectMarker(formula.marker);
        if (!target) {
          continue;
        }

        dispatchPlainTextPaste(target, formula.formula);
        if (await waitForMarkerRemoval(formula)) {
          convertedCount += 1;
          // Notion removes the marker before its equation block has completely
          // settled. Starting the next replacement immediately can steal focus.
          await waitForEditorUpdate(140);
        }
      } catch (error) {
        console.warn("Notion LaTeX replacement failed", error);
        await replaceMarkerWithRawFormula(formula);
      }
    }

    await removeRemainingMarkers(formulas);
    showConvertedToast(convertedCount, formulas.length);
  } finally {
    redispatchingPaste = false;
  }
}

async function waitForInitialPaste(formulas: FormulaPlaceholder[]): Promise<void> {
  const lastFormula = formulas[formulas.length - 1];
  if (!lastFormula) {
    return;
  }

  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    // Notion creates pasted blocks in document order. Seeing the last marker
    // means it has finished materializing the response before replacements
    // start changing focus and block types.
    if (findMarker(lastFormula.marker)) {
      await waitForEditorUpdate(120);
      return;
    }
    await waitForEditorUpdate(25);
  }
}

function dispatchPlainTextPaste(target: Element, text: string): void {
  const clipboardData = new DataTransfer();
  clipboardData.setData("text/plain", text);
  const replacementEvent = new ClipboardEvent("paste", {
    bubbles: true,
    cancelable: true,
    composed: true,
    clipboardData
  });

  const notCancelled = target.dispatchEvent(replacementEvent);
  if (notCancelled) {
    insertPlainTextFallback(text);
  }
}

async function selectMarker(marker: string): Promise<HTMLElement | undefined> {
  const deadline = Date.now() + 2500;
  while (Date.now() < deadline) {
    const match = findMarker(marker);
    if (match) {
      match.editable.focus({ preventScroll: true });
      const selection = document.getSelection();
      if (!selection) {
        return undefined;
      }
      selection.removeAllRanges();
      selection.addRange(match.range);
      return match.editable;
    }

    await waitForEditorUpdate(25);
  }

  return undefined;
}

function findMarker(marker: string): { editable: HTMLElement; range: Range } | undefined {
  const editables = document.querySelectorAll<HTMLElement>('[contenteditable="true"]');
  for (const editable of editables) {
    const nodes = collectOwnedTextNodes(editable);
    const span = findMarkerTextSpan(nodes.map((node) => node.data), marker);
    if (!span) {
      continue;
    }

    const range = document.createRange();
    range.setStart(nodes[span.startChunk], span.startOffset);
    range.setEnd(nodes[span.endChunk], span.endOffset);
    return { editable, range };
  }
  return undefined;
}

function collectOwnedTextNodes(editable: HTMLElement): Text[] {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(editable, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    if (
      current instanceof Text &&
      current.data.length > 0 &&
      current.parentElement?.closest('[contenteditable="true"]') === editable
    ) {
      nodes.push(current);
    }
    current = walker.nextNode();
  }
  return nodes;
}

async function waitForMarkerRemoval(formula: FormulaPlaceholder): Promise<boolean> {
  const deadline = Date.now() + 1200;
  while (Date.now() < deadline) {
    if (!findMarker(formula.marker)) {
      return true;
    }
    await waitForEditorUpdate(20);
  }

  // Never leave an internal marker in the user's page if Notion rejects the
  // replacement paste. The raw single-line formula is still the best fallback.
  await replaceMarkerWithRawFormula(formula);
  return false;
}

async function replaceMarkerWithRawFormula(formula: FormulaPlaceholder): Promise<void> {
  const target = await selectMarker(formula.marker);
  if (target) {
    document.execCommand("insertText", false, formula.formula);
    await waitForEditorUpdate(40);
  }
}

async function removeRemainingMarkers(formulas: FormulaPlaceholder[]): Promise<void> {
  for (const formula of formulas) {
    if (findMarker(formula.marker)) {
      await replaceMarkerWithRawFormula(formula);
    }
  }
}

function waitForEditorUpdate(delay: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, delay));
}

function showConvertedToast(convertedCount: number, mathCount: number): void {
  const existing = document.getElementById("notion-latex-paste-toast");
  existing?.remove();

  const toast = document.createElement("div");
  toast.id = "notion-latex-paste-toast";
  const complete = convertedCount === mathCount;
  toast.textContent = complete
    ? `已转换 ${mathCount} 个 LaTeX 公式`
    : `已转换 ${convertedCount}/${mathCount} 个公式，未转换的已保留原文`;
  Object.assign(toast.style, {
    position: "fixed",
    right: "20px",
    bottom: "20px",
    zIndex: "2147483647",
    padding: "9px 12px",
    borderRadius: "7px",
    background: complete ? "#238636" : "#b45309",
    color: "white",
    font: "13px -apple-system, BlinkMacSystemFont, sans-serif",
    boxShadow: "0 4px 18px rgba(0, 0, 0, 0.22)",
    pointerEvents: "none"
  });
  document.documentElement.appendChild(toast);
  window.setTimeout(() => toast.remove(), 1800);
}
