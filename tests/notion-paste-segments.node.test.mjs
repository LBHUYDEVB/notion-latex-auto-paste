import test from "node:test";
import assert from "node:assert/strict";
import {
  buildNotionPastePlan,
  findMarkerTextSpan,
  splitNotionPasteSegments
} from "../src/notion-paste-segments.ts";

test("splits mixed Notion paste into prose and isolated formulas", () => {
  assert.deepEqual(
    splitNotionPasteSegments("标题\n\n$$B_i(\\omega)$$\n\n正文 $$c_i$$ 结束"),
    [
      { text: "标题\n\n", formula: false },
      { text: "$$B_i(\\omega)$$", formula: true },
      { text: "\n\n正文 ", formula: false },
      { text: "$$c_i$$", formula: true },
      { text: " 结束", formula: false }
    ]
  );
});

test("does not split dollar markers inside code", () => {
  const input = "```text\n$$not formula$$\n```\nUse `$$also code$$` here.";
  assert.deepEqual(splitNotionPasteSegments(input), [{ text: input, formula: false }]);
});

test("builds one complete paste with stable formula placeholders", () => {
  const input = "## 标题 $$B_i(\\omega)$$\n\n正文 $$c_i$$ 结束";
  assert.deepEqual(buildNotionPastePlan(input, "TEST"), {
    text: "## 标题 NLTXTESTX0X\n\n正文 NLTXTESTX1X 结束",
    formulas: [
      { marker: "NLTXTESTX0X", formula: "$$B_i(\\omega)$$" },
      { marker: "NLTXTESTX1X", formula: "$$c_i$$" }
    ]
  });
});

test("keeps code dollar markers out of the replacement plan", () => {
  const input = "```text\n$$not formula$$\n```\n\n$$x+y$$";
  assert.deepEqual(buildNotionPastePlan(input, "CODE"), {
    text: "```text\n$$not formula$$\n```\n\nNLTXCODEX0X",
    formulas: [{ marker: "NLTXCODEX0X", formula: "$$x+y$$" }]
  });
});

test("finds a marker joined directly to surrounding prose", () => {
  assert.deepEqual(findMarkerTextSpan(["前文NLTXTESTX12X后文"], "NLTXTESTX12X"), {
    startChunk: 0,
    startOffset: 2,
    endChunk: 0,
    endOffset: 14
  });
});

test("finds a marker split across several DOM text nodes", () => {
  assert.deepEqual(
    findMarkerTextSpan(["前文NLTX", "TEST", "X13X后文"], "NLTXTESTX13X"),
    {
      startChunk: 0,
      startOffset: 2,
      endChunk: 2,
      endOffset: 4
    }
  );
});

test("does not report a partial marker", () => {
  assert.equal(findMarkerTextSpan(["NLTXTEST", "X13"], "NLTXTESTX13X"), undefined);
});
