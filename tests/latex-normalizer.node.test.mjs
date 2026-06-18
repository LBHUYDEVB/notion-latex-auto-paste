import test from "node:test";
import assert from "node:assert/strict";
import { normalizeLatexForNotion } from "../src/latex-normalizer.ts";

test("collapses the user's multiline inline formula", () => {
  const input = "$f(\\omega)\n\\approx\n\\sum_i c_iB_i(\\omega)$";
  assert.deepEqual(normalizeLatexForNotion(input), {
    text: "$$f(\\omega) \\approx \\sum_i c_iB_i(\\omega)$$",
    changed: true,
    mathCount: 1
  });
});

test("normalizes mixed ChatGPT prose and formulas", () => {
  const input = "行内 \\(a^2 + b^2 = c^2\\)。\r\n\r\n\\[\r\nE = mc^2\r\n\\]";
  assert.equal(
    normalizeLatexForNotion(input).text,
    "行内 $$a^2 + b^2 = c^2$$。\r\n\r\n$$E = mc^2$$"
  );
});

test("preserves surrounding Markdown structure", () => {
  const input = "## 结论\n\n- 第一项：$a\n+ b$\n- 第二项：普通文本";
  assert.equal(
    normalizeLatexForNotion(input).text,
    "## 结论\n\n- 第一项：$$a + b$$\n- 第二项：普通文本"
  );
});

test("preserves LaTeX line break commands", () => {
  const input = "$$\n\\begin{aligned}\na &= b \\\\\nc &= d\n\\end{aligned}\n$$";
  assert.equal(
    normalizeLatexForNotion(input).text,
    "$$\\begin{aligned} a &= b \\\\ c &= d \\end{aligned}$$"
  );
});

test("leaves fenced and inline code opaque", () => {
  const input = "```\n$x\ny$\n```\n\nUse `$a\nb$` here.";
  assert.deepEqual(normalizeLatexForNotion(input), {
    text: input,
    changed: false,
    mathCount: 0
  });
});

test("does not interpret currency as math", () => {
  const input = "It costs $5 today and $10 tomorrow.";
  assert.deepEqual(normalizeLatexForNotion(input), {
    text: input,
    changed: false,
    mathCount: 0
  });
});

test("keeps non-formula CRLF text byte-for-byte unchanged", () => {
  const input = "普通文本\r\n第二行";
  assert.deepEqual(normalizeLatexForNotion(input), {
    text: input,
    changed: false,
    mathCount: 0
  });
});

test("normalizes multiple formulas in a copied ChatGPT response", () => {
  const input = [
    "它把这一整套：",
    "",
    "$$",
    "Y_l^m(\\theta,\\phi)",
    "$$",
    "",
    "压缩写成了：",
    "",
    "$$",
    "B_i(\\omega)",
    "$$",
    "",
    "行内公式 $B_i$ 也应该处理。"
  ].join("\n");

  assert.deepEqual(normalizeLatexForNotion(input), {
    text: [
      "它把这一整套：",
      "",
      "$$Y_l^m(\\theta,\\phi)$$",
      "",
      "压缩写成了：",
      "",
      "$$B_i(\\omega)$$",
      "",
      "行内公式 $$B_i$$ 也应该处理。"
    ].join("\n"),
    changed: true,
    mathCount: 3
  });
});

test("still reports already normalized formulas for Notion post-processing", () => {
  assert.deepEqual(normalizeLatexForNotion("正文 $$x+y$$ 结束"), {
    text: "正文 $$x+y$$ 结束",
    changed: false,
    mathCount: 1
  });
});
