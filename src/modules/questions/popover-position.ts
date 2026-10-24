export interface AnchorRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}
/** Fixed panels and their invokers use viewport coordinates, including after scrolling. */
export function placePopover(
  anchor: AnchorRect,
  size: { width: number; height: number },
  viewport: { width: number; height: number },
  account: boolean,
) {
  const edge = 12,
    gap = 8;
  const mobile = viewport.width < 640;
  let height = Math.min(size.height, Math.max(0, viewport.height - edge * 2));
  let left = anchor.left,
    top = anchor.bottom + gap;
  let placement: "right" | "left" | "above" | "below" = "below";
  if (account && !mobile) {
    left = anchor.right + gap;
    if (left + size.width > viewport.width - edge) {
      left = anchor.left - size.width - gap;
      placement = "left";
    } else placement = "right";
    top = anchor.bottom - height;
  } else if (mobile) {
    left = (viewport.width - size.width) / 2;
    top = account ? anchor.top - height - gap : viewport.height - height - edge;
    placement = "above";
  } else {
    const below = Math.max(0, viewport.height - edge - anchor.bottom - gap);
    const above = Math.max(0, anchor.top - edge - gap);
    if (height > below && above > below) {
      height = Math.min(height, above);
      top = anchor.top - height - gap;
      placement = "above";
    } else height = Math.min(height, below);
  }
  return {
    left: Math.max(edge, Math.min(left, viewport.width - size.width - edge)),
    top: Math.max(edge, Math.min(top, viewport.height - height - edge)),
    height,
    placement,
  };
}
