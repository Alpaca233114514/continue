import { describe, expect, it, vi } from "vitest";

import { VsCodeWebviewProtocol } from "./webviewProtocol";

vi.mock("vscode", () => ({
  window: {
    showInformationMessage: vi.fn(),
  },
}));

vi.mock("./util/errorHandling", () => ({
  handleLLMError: vi.fn(async () => false),
}));

vi.mock("core/util/posthog", () => ({
  Telemetry: {
    capture: vi.fn(),
  },
}));

vi.mock("core/util/extractMinimalStackTraceInfo", () => ({
  extractMinimalStackTraceInfo: vi.fn(() => undefined),
}));

describe("VsCodeWebviewProtocol", () => {
  it("responds with non-Error handler failures without throwing", async () => {
    const protocol = new VsCodeWebviewProtocol();
    const postedMessages: any[] = [];
    let messageHandler: ((message: any) => Promise<void>) | undefined;

    const webview = {
      postMessage: vi.fn((message) => {
        postedMessages.push(message);
      }),
      onDidReceiveMessage: vi.fn((handler) => {
        messageHandler = handler;
        return { dispose: vi.fn() };
      }),
    };

    protocol.webview = webview as any;
    protocol.on("config/getSerializedProfileInfo" as any, async () => {
      throw undefined;
    });

    await messageHandler?.({
      messageType: "config/getSerializedProfileInfo",
      messageId: "message-id",
      data: undefined,
    });

    expect(postedMessages).toContainEqual({
      messageType: "config/getSerializedProfileInfo",
      messageId: "message-id",
      data: {
        done: true,
        error: "undefined",
        status: "error",
      },
    });
  });
});
