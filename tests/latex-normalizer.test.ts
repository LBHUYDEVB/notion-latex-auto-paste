import { describe, expect, it } from "vitest";
import { normalizeLatexForNotion } from "../src/latex-normalizer";

describe("normalizeLatexForNotion", () => {
  it("collapses physical line breaks inside an inline dollar formula", () => {
    const input = "$f(\\omega)\n\\approx\n\\sum_i c_iB_i(\\omega)$";
    expect(normalizeLatexForNotion(input)).toEqual({
      text: "$$f(\\omega) \\approx \\sum_i c_iB_i(\\omega)$$",
      changed: true,
      mathCount: 1
    });
  });

  it("puts a multiline display formula on one physical line", () => {
    const input = "前文\n\n$$\n\\int_0^1 x^2 \\, dx\n= \\frac{1}{3}\n$$\n\n后文";
    expect(normalizeLatexForNotion(input).text).toBe(
      "前文\n\n$$\\int_0^1 x^2 \\, dx = \\frac{1}{3}$$\n\n后文"
    );
  });

  it("converts ChatGPT backslash delimiters", () => {
    const input = "行内 \\(a^2 + b^2 = c^2\\)。\n\n\\[\nE = mc^2\n\\]";
    expect(normalizeLatexForNotion(input).text).toBe(
      "行内 $$a^2 + b^2 = c^2$$。\n\n$$E = mc^2$$"
    );
  });

  it("preserves prose, headings, and lists around formulas", () => {
    const input = "## 结论\n\n- 第一项：$a\n+ b$\n- 第二项：普通文本";
    expect(normalizeLatexForNotion(input).text).toBe(
      "## 结论\n\n- 第一项：$$a + b$$\n- 第二项：普通文本"
    );
  });

  it("preserves LaTeX line break commands in aligned and matrix environments", () => {
    const input = "$$\n\\begin{aligned}\na &= b \\\\\nc &= d\n\\end{aligned}\n$$\n\n$$\n\\begin{bmatrix}\n1 & 0 \\\\\n0 & 1\n\\end{bmatrix}\n$$";
    expect(normalizeLatexForNotion(input).text).toBe(
      "$$\\begin{aligned} a &= b \\\\ c &= d \\end{aligned}$$\n\n$$\\begin{bmatrix} 1 & 0 \\\\ 0 & 1 \\end{bmatrix}$$"
    );
  });

  it("does not alter fenced or inline code", () => {
    const input = "```js\nconst price = '$5';\nconst formula = '$a\\nb$';\n```\n\nUse `$x\ny$` here.";
    expect(normalizeLatexForNotion(input)).toEqual({
      text: input,
      changed: false,
      mathCount: 0
    });
  });

  it("does not interpret common currency text as math", () => {
    const input = "It costs $5 today and $10 tomorrow.";
    expect(normalizeLatexForNotion(input)).toEqual({
      text: input,
      changed: false,
      mathCount: 0
    });
  });

  it("leaves text without formulas untouched", () => {
    const input = "普通文本\n第二行";
    expect(normalizeLatexForNotion(input)).toEqual({
      text: input,
      changed: false,
      mathCount: 0
    });
  });
});
