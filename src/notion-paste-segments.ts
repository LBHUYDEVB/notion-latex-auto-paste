export interface PasteSegment {
  text: string;
  formula: boolean;
}

export interface FormulaPlaceholder {
  marker: string;
  formula: string;
}

export interface NotionPastePlan {
  text: string;
  formulas: FormulaPlaceholder[];
}

export interface MarkerTextSpan {
  startChunk: number;
  startOffset: number;
  endChunk: number;
  endOffset: number;
}

/**
 * Replaces formulas with plain, Markdown-safe markers for the first paste.
 * Once Notion has created its blocks, each marker can be selected and replaced
 * through the same single-formula paste path that Notion already understands.
 */
export function buildNotionPastePlan(input: string, token = createPasteToken()): NotionPastePlan {
  const formulas: FormulaPlaceholder[] = [];
  const text = splitNotionPasteSegments(input)
    .map((segment) => {
      if (!segment.formula) {
        return segment.text;
      }

      const marker = `NLTX${token}X${formulas.length}X`;
      formulas.push({ marker, formula: segment.text });
      return marker;
    })
    .join("");

  return { text, formulas };
}

/** Maps a marker in concatenated DOM text back to its individual text nodes. */
export function findMarkerTextSpan(
  chunks: string[],
  marker: string
): MarkerTextSpan | undefined {
  if (!marker) {
    return undefined;
  }

  const markerStart = chunks.join("").indexOf(marker);
  if (markerStart === -1) {
    return undefined;
  }

  const start = locateChunkOffset(chunks, markerStart, true);
  const end = locateChunkOffset(chunks, markerStart + marker.length, false);
  if (!start || !end) {
    return undefined;
  }

  return {
    startChunk: start.chunk,
    startOffset: start.offset,
    endChunk: end.chunk,
    endOffset: end.offset
  };
}

/** Splits normalized Markdown while leaving fenced and inline code untouched. */
export function splitNotionPasteSegments(input: string): PasteSegment[] {
  const segments: PasteSegment[] = [];
  let textStart = 0;
  let index = 0;
  let inlineCodeMarker = "";
  let fenceMarker = "";
  let lineStart = true;

  while (index < input.length) {
    if (lineStart && !inlineCodeMarker) {
      const fence = readFence(input, index);
      if (fence) {
        if (!fenceMarker) {
          fenceMarker = fence;
        } else if (fence[0] === fenceMarker[0] && fence.length >= fenceMarker.length) {
          fenceMarker = "";
        }
        index += fence.length;
        lineStart = false;
        continue;
      }
    }

    if (!fenceMarker && input[index] === "`") {
      const marker = readRepeated(input, index, "`");
      if (!inlineCodeMarker) {
        inlineCodeMarker = marker;
      } else if (marker === inlineCodeMarker) {
        inlineCodeMarker = "";
      }
      index += marker.length;
      lineStart = false;
      continue;
    }

    if (!fenceMarker && !inlineCodeMarker && input.startsWith("$$", index)) {
      const end = findFormulaEnd(input, index + 2);
      if (end !== -1) {
        pushSegment(segments, input.slice(textStart, index), false);
        pushSegment(segments, input.slice(index, end + 2), true);
        index = end + 2;
        textStart = index;
        lineStart = false;
        continue;
      }
    }

    if (input[index] === "\n" || input[index] === "\r") {
      if (input[index] === "\r" && input[index + 1] === "\n") {
        index += 1;
      }
      lineStart = true;
    } else {
      lineStart = false;
    }
    index += 1;
  }

  pushSegment(segments, input.slice(textStart), false);
  return mergeAdjacentText(segments);
}

function readFence(input: string, index: number): string | undefined {
  let cursor = index;
  let spaces = 0;
  while (input[cursor] === " " && spaces < 3) {
    cursor += 1;
    spaces += 1;
  }
  const character = input[cursor];
  if (character !== "`" && character !== "~") {
    return undefined;
  }
  const marker = readRepeated(input, cursor, character);
  return marker.length >= 3 ? marker : undefined;
}

function readRepeated(input: string, index: number, character: string): string {
  let cursor = index;
  while (input[cursor] === character) {
    cursor += 1;
  }
  return input.slice(index, cursor);
}

function findFormulaEnd(input: string, start: number): number {
  for (let index = start; index < input.length - 1; index += 1) {
    if (input.startsWith("$$", index) && !isEscaped(input, index)) {
      return index;
    }
  }
  return -1;
}

function isEscaped(input: string, index: number): boolean {
  let slashCount = 0;
  for (let cursor = index - 1; cursor >= 0 && input[cursor] === "\\"; cursor -= 1) {
    slashCount += 1;
  }
  return slashCount % 2 === 1;
}

function pushSegment(segments: PasteSegment[], text: string, formula: boolean): void {
  if (text) {
    segments.push({ text, formula });
  }
}

function mergeAdjacentText(segments: PasteSegment[]): PasteSegment[] {
  const result: PasteSegment[] = [];
  for (const segment of segments) {
    const previous = result[result.length - 1];
    if (previous && !previous.formula && !segment.formula) {
      previous.text += segment.text;
    } else {
      result.push({ ...segment });
    }
  }
  return result;
}

function createPasteToken(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${timestamp}${random}`;
}

function locateChunkOffset(
  chunks: string[],
  absoluteOffset: number,
  preferNextAtBoundary: boolean
): { chunk: number; offset: number } | undefined {
  let consumed = 0;
  for (let index = 0; index < chunks.length; index += 1) {
    const next = consumed + chunks[index].length;
    if (
      absoluteOffset < next ||
      (absoluteOffset === next && (!preferNextAtBoundary || index === chunks.length - 1))
    ) {
      return { chunk: index, offset: absoluteOffset - consumed };
    }
    consumed = next;
  }
  return undefined;
}
