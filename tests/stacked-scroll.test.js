import test from 'node:test';
import assert from 'node:assert/strict';
import { getStackProgress, getStackFrame } from '../stacked-scroll.js';

test('The scroll timeline clamps to the selected project count in either direction', () => {
  assert.equal(getStackProgress(-200, 500, 11), 0);
  assert.equal(getStackProgress(1250, 500, 11), 2.5);
  assert.equal(getStackProgress(5000, 500, 11), 10);
  assert.equal(getStackProgress(9000, 500, 11), 10);
  // Filtering to three projects must shorten the timeline immediately.
  assert.equal(getStackProgress(5000, 500, 3), 2);
  assert.equal(getStackProgress(500, 500, 1), 0);
  assert.equal(getStackProgress(500, 500, 0), 0);
  assert.equal(getStackProgress(500, 0, 11), 0);
});

test('Every project can occupy the readable, fully opaque front of the stack', () => {
  for (let index = 0; index < 11; index++) {
    const frame = getStackFrame(index, index);
    assert.equal(frame.opacity, 1);
    assert.equal(frame.visible, true);
    assert.equal(frame.transform, 'translate3d(0%, 0%, 0px) rotateY(0deg) scale(1)');
  }
});

test('Only nearby layers are painted and outgoing cards finish their exit', () => {
  for (const progress of [0, 1.25, 4.5, 9.9, 10]) {
    const visible = Array.from({length:11}, (_, index) => ({index, ...getStackFrame(index, progress)})).filter(frame => frame.visible);
    assert.ok(visible.length >= 1 && visible.length <= 4);
    assert.ok(visible.every(frame => frame.index > progress - 1 && frame.index < progress + 3));
  }
  assert.equal(getStackFrame(0, 1).opacity, 0);
  assert.equal(getStackFrame(3, 0).visible, false);
  assert.equal(getStackFrame(10, 0).visible, false);
});

test('Stopping between projects leaves the selected card fully opaque', () => {
  for (const progress of [0.25, 0.5, 1.35, 4.49, 4.51, 9.9]) {
    assert.equal(getStackFrame(Math.round(progress), progress).opacity, 1);
  }
});

test('Fractional scrolling is continuous across project boundaries and reversible', () => {
  const values = transform => [...transform.matchAll(/-?\d+(?:\.\d+)?/g)].map(match => Number(match[0]));
  const epsilon = 0.000001;
  for (let index = 0; index < 11; index++) {
    for (const boundary of [index - 3, index - 2, index, index + 0.5, index + 1]) {
      const before = getStackFrame(index, boundary - epsilon);
      const after = getStackFrame(index, boundary + epsilon);
      assert.ok(Math.abs(before.opacity - after.opacity) < 0.00001);
      values(before.transform).forEach((value, axis) => assert.ok(Math.abs(value - values(after.transform)[axis]) < 0.001));
    }
    const snapshot = getStackFrame(index, 4.25);
    getStackFrame(index, 8.5);
    assert.deepEqual(getStackFrame(index, 4.25), snapshot);
  }
});
