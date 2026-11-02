import { describe, expect, it } from 'vitest';
import { analyzeTypedText, typingReveal } from '../typed-text';

type Box = { x0: number; x1: number; y0: number; y1: number };

function image(width: number, height: number, boxes: Box[], background = [255, 255, 255], ink = [20, 20, 20]) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const inside = boxes.some((b) => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1);
      const [r, g, b] = inside ? ink : background;
      data.set([r!, g!, b!, 255], (y * width + x) * 4);
    }
  }
  return data;
}

describe('analyzeTypedText', () => {
  it('finds one line of text on the field background', () => {
    const data = image(120, 20, [
      { x0: 4, x1: 10, y0: 5, y1: 14 },
      { x0: 13, x1: 40, y0: 5, y1: 14 },
    ]);
    const text = analyzeTypedText(data, 120, 20);
    expect(text?.background).toBe('#ffffff');
    expect(text?.ink).toBe('#141414');
    expect(text?.lines).toMatchObject([{ x0: 4, x1: 40, y0: 5, y1: 14, gaps: [11, 12] }]);
  });

  it('splits a textarea into lines', () => {
    const data = image(100, 50, [
      { x0: 2, x1: 80, y0: 4, y1: 12 },
      { x0: 2, x1: 50, y0: 20, y1: 28 },
    ]);
    expect(analyzeTypedText(data, 100, 50)?.lines).toMatchObject([
      { x0: 2, x1: 80, y0: 4, y1: 12 },
      { x0: 2, x1: 50, y0: 20, y1: 28 },
    ]);
  });

  it('keeps a diacritic above a letter with its line', () => {
    const data = image(60, 40, [
      { x0: 6, x1: 8, y0: 2, y1: 3 },
      { x0: 4, x1: 30, y0: 6, y1: 16 },
      { x0: 4, x1: 30, y0: 22, y1: 32 },
    ]);
    expect(analyzeTypedText(data, 60, 40)?.lines).toMatchObject([
      { y0: 2, y1: 16 },
      { y0: 22, y1: 32 },
    ]);
  });

  it('leaves an icon far to the right of the text out', () => {
    const data = image(200, 20, [
      { x0: 4, x1: 40, y0: 5, y1: 14 },
      { x0: 180, x1: 190, y0: 5, y1: 14 },
    ]);
    expect(analyzeTypedText(data, 200, 20)?.lines[0]?.x1).toBe(40);
  });

  it('works on a dark field', () => {
    const data = image(80, 20, [{ x0: 4, x1: 30, y0: 5, y1: 14 }], [30, 30, 40], [240, 240, 240]);
    expect(analyzeTypedText(data, 80, 20)?.background).toBe('#1e1e28');
  });

  it('returns nothing for an empty field', () => {
    expect(analyzeTypedText(image(80, 20, []), 80, 20)).toBeNull();
  });
});

describe('typingReveal', () => {
  const lines = [
    { x0: 0, x1: 99, y0: 0, y1: 10 },
    { x0: 0, x1: 49, y0: 15, y1: 25 },
  ];

  it('shows nothing before typing and everything after', () => {
    expect(typingReveal(lines, 10, 0)).toEqual([0, 0]);
    expect(typingReveal(lines, 10, 1)).toEqual([100, 50]);
  });

  it('fills the first line before starting the next', () => {
    expect(typingReveal(lines, 3, 2 / 3)).toEqual([100, 0]);
  });

  it('stops between letters, not through one', () => {
    const line = { x0: 0, x1: 99, y0: 0, y1: 10, gaps: [20, 21, 60] };
    expect(typingReveal([line], 4, 0.5)).toEqual([21]);
  });

  it('moves one character at a time', () => {
    const [a] = typingReveal([{ x0: 0, x1: 99, y0: 0, y1: 10 }], 4, 0.3);
    const [b] = typingReveal([{ x0: 0, x1: 99, y0: 0, y1: 10 }], 4, 0.45);
    expect(a).toBe(25);
    expect(b).toBe(25);
  });
});
