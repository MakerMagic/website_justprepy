import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import { describe, expect, it } from "vitest";
import { blockCrossSiteDEV } from "next/dist/server/lib/router-utils/block-cross-site-dev";
import nextConfig from "../next.config";

// Exercise the actual guard shipped by our pinned Next version. The LAN page's
// debug/hydration stream stalled here even though HTML and native popovers worked.
function checkHydrationOrigin(
  origin: string,
  allowed = nextConfig.allowedDevOrigins,
) {
  const request = new IncomingMessage(new Socket());
  request.url = "/_next/hmr?id=question-bank-regression";
  request.headers.origin = origin;
  const response = new ServerResponse(request);
  const blocked = blockCrossSiteDEV(request, response, allowed, "0.0.0.0");
  return {
    blocked,
    status: response.statusCode,
    ended: response.writableEnded,
  };
}

describe("development preview hydration transport", () => {
  it("accepts the actual LAN preview origins so React can initialize", () => {
    expect(checkHydrationOrigin("http://192.168.1.2:3000")).toEqual({
      blocked: false,
      status: 200,
      ended: false,
    });
    expect(checkHydrationOrigin("http://192.168.1.4:3000")).toEqual({
      blocked: false,
      status: 200,
      ended: false,
    });
  });
  it("reproduces the old rejection when the LAN allowance is absent", () => {
    expect(checkHydrationOrigin("http://192.168.1.2:3000", [])).toEqual({
      blocked: true,
      status: 403,
      ended: true,
    });
    expect(checkHydrationOrigin("http://192.168.1.4:3000", [])).toEqual({
      blocked: true,
      status: 403,
      ended: true,
    });
  });
  it("preserves localhost development access", () => {
    expect(checkHydrationOrigin("http://localhost:3000").blocked).toBe(false);
  });
  it("still rejects unrelated origins instead of allowing all hosts", () => {
    expect(checkHydrationOrigin("https://untrusted.example")).toEqual({
      blocked: true,
      status: 403,
      ended: true,
    });
  });
});
