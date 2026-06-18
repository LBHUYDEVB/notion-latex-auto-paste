export interface NormalizeResult {
  text: string;
  changed: boolean;
  mathCount: number;
}

interface SegmentResult {
  text: string;
  mathCount: number;
}

interface Delimiter {
  open: string;
  close: string;
  outputOpen: string;
  outputClose: string;
  display: boolean;
}

const DELIMITERS: Delimiter[] = [
  { open: "$$", close: "$$", outputOpen: "$$", outputClose: "$$", display: true },
  { open: "\\[", close: "\\]", outputOpen: "$$", outputClose: "$$", display: true },
  { open: "\\(", close: "\\)", outputOpen: "$$", outputClose: "$$", display: false },
  { open: "$", close: "$", outputOpen: "$$", outputClose: "$$", display: false }
];

/**
 * Makes copied LaTeX compatible with Notion without changing surrounding prose.
 * Fenced and inline code are intentionally opaque.
 */
export function normalizeLatexForNotion(input: string): NormalizeResult {
  const segments = splitFencedCode(input);
  let mathCount = 0;

  const text = segments
    .map((segment) => {
      if (segment.code) {
        return segment.text;
      }

      const result = normalizeTextSegment(segment.text);
      mathCount += result.mathCount;
      return result.text;
    })
    .join("");

  return {
    text,
    changed: text !== input,
    mathCount
  };
}

function splitFencedCode(input: string): Array<{ text: string; code: boolean }> {
  const lines = input.match(/[^\r\n]*(?:\r\n|\n|\r|$)/g)?.filter(Boolean) ?? [];
  const segments: Array<{ text: string; code: boolean }> = [];
  let buffer = "";
  let inFence = false;
  let fenceCharacter = "";
  let fenceLength = 0;

  const flush = (code: boolean) => {
    if (buffer) {
      segments.push({ text: buffer, code });
      buffer = "";
    }
  };

  for (const line of lines) {
    let openedThisLine = false;
    if (!inFence) {
      const opening = line.match(/^ {0,3}(`{3,}|~{3,})/);
      if (opening) {
        flush(false);
        inFence = true;
        openedThisLine = true;
        fenceCharacter = opening[1][0];
        fenceLength = opening[1].length;
      }
    }

    buffer += line;

    if (inFence && !openedThisLine) {
      const closingPattern = new RegExp(`^ {0,3}${escapeRegExp(fenceCharacter)}{${fenceLength},}\\s*$`);
      if (closingPattern.test(line.replace(/(?:\r\n|\n|\r)$/, ""))) {
        flush(true);
        inFence = false;
        fenceCharacter = "";
        fenceLength = 0;
      }
    }
  }

  flush(inFence);
  return segments;
}

function normalizeTextSegment(input: string): SegmentResult {
  let output = "";
  let mathCount = 0;
  let index = 0;

  while (index < input.length) {
    if (input[index] === "`") {
      const codeEnd = findInlineCodeEnd(input, index);
      if (codeEnd !== -1) {
        output += input.slice(index, codeEnd);
        index = codeEnd;
        continue;
      }
    }

    const delimiter = delimiterAt(input, index);
    if (!delimiter || !isValidOpening(input, index, delimiter)) {
      output += input[index];
      index += 1;
      continue;
    }

    const bodyStart = index + delimiter.open.length;
    const closingIndex = findClosingDelimiter(input, bodyStart, delimiter);
    if (closingIndex === -1) {
      output += input[index];
      index += 1;
      continue;
    }

    const body = input.slice(bodyStart, closingIndex);
    if (!isValidMathBody(body)) {
      output += input[index];
      index += 1;
      continue;
    }

    const normalizedBody = collapsePhysicalLineBreaks(body);
    output += `${delimiter.outputOpen}${normalizedBody}${delimiter.outputClose}`;
    mathCount += 1;
    index = closingIndex + delimiter.close.length;
  }

  return { text: output, mathCount };
}

function delimiterAt(input: string, index: number): Delimiter | undefined {
  if (isEscaped(input, index)) {
    return undefined;
  }

  return DELIMITERS.find((delimiter) => input.startsWith(delimiter.open, index));
}

function isValidOpening(input: string, index: number, delimiter: Delimiter): boolean {
  if (delimiter.open !== "$") {
    return true;
  }

  const previous = input[index - 1] ?? "";
  const next = input[index + 1] ?? "";
  return !/[A-Za-z0-9\\]/.test(previous) && next !== "$" && !/\s/.test(next);
}

function findClosingDelimiter(input: string, start: number, delimiter: Delimiter): number {
  for (let index = start; index <= input.length - delimiter.close.length; index += 1) {
    if (!input.startsWith(delimiter.close, index) || isEscaped(input, index)) {
      continue;
    }

    if (delimiter.close === "$" && input[index + 1] === "$") {
      continue;
    }

    if (delimiter.close === "$") {
      const previous = input[index - 1] ?? "";
      const next = input[index + 1] ?? "";
      if (/\s/.test(previous) || /[0-9]/.test(next)) {
        continue;
      }
    }

    return index;
  }

  return -1;
}

function isValidMathBody(body: string): boolean {
  const trimmed = body.trim();
  return trimmed.length > 0 && !/(?:\r\n|\n|\r)[ \t]*(?:\r\n|\n|\r)/.test(trimmed);
}

function collapsePhysicalLineBreaks(body: string): string {
  return body.replace(/[ \t]*(?:\r\n|\n|\r)[ \t]*/g, " ").trim();
}

function findInlineCodeEnd(input: string, start: number): number {
  let markerLength = 1;
  while (input[start + markerLength] === "`") {
    markerLength += 1;
  }

  const marker = "`".repeat(markerLength);
  const end = input.indexOf(marker, start + markerLength);
  return end === -1 ? -1 : end + markerLength;
}

function isEscaped(input: string, index: number): boolean {
  let slashCount = 0;
  for (let cursor = index - 1; cursor >= 0 && input[cursor] === "\\"; cursor -= 1) {
    slashCount += 1;
  }
  return slashCount % 2 === 1;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
