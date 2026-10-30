"use client";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { SettingsDialog } from "./settings-dialog";
import { cropGeometry } from "./settings.logic";
export function AvatarCropper({
  onApply,
  onError,
}: {
  onApply: (image: string) => void;
  onError: (message: string) => void;
}) {
  const file = useRef<HTMLInputElement>(null),
    canvas = useRef<HTMLCanvasElement>(null),
    preview = useRef<HTMLCanvasElement>(null),
    image = useRef<HTMLImageElement | null>(null);
  const drag = useRef<{ x: number; y: number } | null>(null),
    view = useRef({ zoom: 1, x: 0, y: 0 }),
    url = useRef<string | null>(null);
  const [open, setOpen] = useState(false),
    [zoom, setZoom] = useState(1);
  function paint(ctx: CanvasRenderingContext2D, size: number) {
    const img = image.current;
    if (!img) return;
    const v = view.current,
      g = cropGeometry(img.width, img.height, v.zoom, v.x, v.y),
      factor = size / 244;
    ctx.drawImage(
      img,
      (122 + g.x - (img.width * g.scale) / 2) * factor,
      (122 + g.y - (img.height * g.scale) / 2) * factor,
      img.width * g.scale * factor,
      img.height * g.scale * factor,
    );
  }
  function draw() {
    const img = image.current,
      cv = canvas.current,
      pv = preview.current;
    if (!img || !cv || !pv) return;
    const cx = cv.getContext("2d"),
      px = pv.getContext("2d");
    if (!cx || !px) return;
    const g = cropGeometry(
      img.width,
      img.height,
      view.current.zoom,
      view.current.x,
      view.current.y,
    );
    view.current = { zoom: view.current.zoom, x: g.x, y: g.y };
    cx.clearRect(0, 0, 260, 260);
    cx.drawImage(
      img,
      130 + g.x - (img.width * g.scale) / 2,
      130 + g.y - (img.height * g.scale) / 2,
      img.width * g.scale,
      img.height * g.scale,
    );
    cx.save();
    cx.fillStyle = "rgba(0,0,0,.55)";
    cx.beginPath();
    cx.rect(0, 0, 260, 260);
    cx.arc(130, 130, 122, 0, Math.PI * 2, true);
    cx.fill("evenodd");
    cx.restore();
    cx.strokeStyle = "#fff";
    cx.lineWidth = 2;
    cx.beginPath();
    cx.arc(130, 130, 122, 0, Math.PI * 2);
    cx.stroke();
    px.clearRect(0, 0, 112, 112);
    px.save();
    px.beginPath();
    px.arc(56, 56, 56, 0, Math.PI * 2);
    px.clip();
    paint(px, 112);
    px.restore();
  }
  const drawRef = useRef(draw);
  useEffect(() => {
    drawRef.current = draw;
  });
  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      view.current.zoom = Math.max(
        1,
        Math.min(3, view.current.zoom - event.deltaY * 0.002),
      );
      setZoom(view.current.zoom);
      drawRef.current();
    };
    cv.addEventListener("wheel", wheel, { passive: false });
    return () => cv.removeEventListener("wheel", wheel);
  }, []);
  useEffect(
    () => () => {
      if (url.current) URL.revokeObjectURL(url.current);
    },
    [],
  );
  function close() {
    setOpen(false);
    drag.current = null;
    if (file.current) file.current.value = "";
    image.current = null;
  }
  function load(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      onError("Please choose an image file.");
      event.target.value = "";
      return;
    }
    if (selected.size > 8 * 1024 * 1024) {
      onError("Image is too large (max 8 MB).");
      event.target.value = "";
      return;
    }
    if (url.current) URL.revokeObjectURL(url.current);
    const source = URL.createObjectURL(selected);
    url.current = source;
    const img = new Image();
    img.onload = () => {
      if (url.current !== source) return;
      image.current = img;
      view.current = { zoom: 1, x: 0, y: 0 };
      setZoom(1);
      draw();
      setOpen(true);
      URL.revokeObjectURL(source);
      url.current = null;
    };
    img.onerror = () => {
      if (url.current !== source) return;
      onError("That image could not be read.");
      URL.revokeObjectURL(source);
      url.current = null;
      if (file.current) file.current.value = "";
    };
    img.src = source;
  }
  return (
    <>
      <button
        className="btn"
        type="button"
        onClick={() => file.current?.click()}
      >
        Change avatar
      </button>
      <input
        ref={file}
        type="file"
        accept="image/*"
        hidden
        onChange={load}
        aria-label="Choose avatar image"
      />
      <SettingsDialog
        open={open}
        onClose={close}
        titleId="avatar-crop-title"
        initialFocus="canvas[tabindex]"
      >
        <h2 id="avatar-crop-title">Adjust your avatar</h2>
        <canvas
          className="cv"
          ref={canvas}
          width="260"
          height="260"
          tabIndex={0}
          aria-label="Drag to reposition the image. Arrow keys also move it."
          onPointerDown={(e) => {
            drag.current = { x: e.clientX, y: e.clientY };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            const factor = 260 / e.currentTarget.getBoundingClientRect().width;
            view.current.x += (e.clientX - drag.current.x) * factor;
            view.current.y += (e.clientY - drag.current.y) * factor;
            drag.current = { x: e.clientX, y: e.clientY };
            draw();
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
          onKeyDown={(e) => {
            const move: Record<string, [number, number]> = {
              ArrowLeft: [-10, 0],
              ArrowRight: [10, 0],
              ArrowUp: [0, -10],
              ArrowDown: [0, 10],
            };
            const delta = move[e.key];
            if (delta) {
              e.preventDefault();
              view.current.x += delta[0];
              view.current.y += delta[1];
              draw();
            }
          }}
        />
        <div className="zr">
          <canvas
            className="pv"
            ref={preview}
            width="112"
            height="112"
            aria-hidden="true"
          />
          <input
            aria-label="Zoom"
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(e) => {
              view.current.zoom = +e.target.value;
              setZoom(+e.target.value);
              draw();
            }}
          />
        </div>
        <div className="acts">
          <button className="btn" type="button" onClick={close}>
            Cancel
          </button>
          <button
            className="btn p"
            type="button"
            onClick={() => {
              const output = document.createElement("canvas");
              output.width = output.height = 256;
              const ctx = output.getContext("2d");
              if (!ctx) {
                onError("That image could not be read.");
                return;
              }
              ctx.fillStyle = "#fff";
              ctx.fillRect(0, 0, 256, 256);
              paint(ctx, 256);
              onApply(output.toDataURL("image/jpeg", 0.88));
              close();
            }}
          >
            Apply
          </button>
        </div>
      </SettingsDialog>
    </>
  );
}
