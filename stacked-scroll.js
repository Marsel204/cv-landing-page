const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// The same bounded timeline drives the cards, counter and navigation targets.
export function getStackProgress(offset, step, count) {
  return step > 0 ? clamp(offset / step, 0, Math.max(0, count - 1)) : 0;
}

export function getStackFrame(index, progress) {
  const distance = clamp(index - progress, -1, 3);
  const upcoming = Math.max(0, distance);
  const outgoing = Math.max(0, -distance);
  const x = upcoming * 12;
  const y = upcoming * 1.2 - outgoing * 2;
  const z = -upcoming * 100 - outgoing * 100;
  const rotation = -upcoming * 10 - outgoing * 18;
  const scale = 1 - upcoming * 0.035 - outgoing * 0.04;
  // A visitor can stop anywhere on the timeline: keep the selected card
  // opaque, and let it recede before fading behind the next project.
  const opacity = 1 - Math.max(0, outgoing - 0.5) * 2 - Math.max(0, upcoming - 2);
  return {
    transform: `translate3d(${x}%, ${y}%, ${z}px) rotateY(${rotation}deg) scale(${scale})`,
    opacity,
    visible: opacity > 0,
  };
}
