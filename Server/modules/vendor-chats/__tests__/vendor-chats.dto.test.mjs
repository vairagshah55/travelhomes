import { describe, it, expect } from "vitest";
import dto from "../vendor-chats.dto.js";

const validId = "a".repeat(24);

describe("vendor-chats.dto.profileQuery", () => {
  it("accepts an email", () => {
    expect(dto.profileQuery.parse({ email: "x@y.io" }).email).toBe("x@y.io");
  });
  it("rejects a non-email", () => {
    expect(() => dto.profileQuery.parse({ email: "nope" })).toThrowError();
  });
  it("accepts type enum values", () => {
    expect(dto.profileQuery.parse({ email: "x@y.io", type: "vendor" }).type).toBe("vendor");
    expect(dto.profileQuery.parse({ email: "x@y.io", type: "user" }).type).toBe("user");
  });
  it("rejects an unknown type", () => {
    expect(() => dto.profileQuery.parse({ email: "x@y.io", type: "admin" })).toThrowError();
  });
});

describe("vendor-chats.dto.createConvBody", () => {
  it("accepts a valid pair of ids", () => {
    expect(dto.createConvBody.parse({ vendorId: validId, userId: "b".repeat(24) })).toMatchObject({
      vendorId: validId,
    });
  });
  it("rejects a non-hex vendorId", () => {
    expect(() => dto.createConvBody.parse({ vendorId: "nope", userId: validId })).toThrowError();
  });
});

describe("vendor-chats.dto.listConvQuery", () => {
  it("accepts a valid participantKind/id pair", () => {
    const parsed = dto.listConvQuery.parse({ participantKind: "Vendor", participantId: validId });
    expect(parsed.participantKind).toBe("Vendor");
  });
  it("rejects an invalid participantKind", () => {
    expect(() =>
      dto.listConvQuery.parse({ participantKind: "Bot", participantId: validId }),
    ).toThrowError();
  });
});

describe("vendor-chats.dto.messagesQuery", () => {
  it("applies pagination defaults", () => {
    const parsed = dto.messagesQuery.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(50);
  });
  it("coerces string ints", () => {
    const parsed = dto.messagesQuery.parse({ page: "3", limit: "20" });
    expect(parsed.page).toBe(3);
    expect(parsed.limit).toBe(20);
  });
  it("rejects limit > 100", () => {
    expect(() => dto.messagesQuery.parse({ limit: "500" })).toThrowError();
  });
  it("rejects non-positive page", () => {
    expect(() => dto.messagesQuery.parse({ page: "0" })).toThrowError();
  });
});

describe("vendor-chats.dto.sendMessageBody", () => {
  const base = { senderId: validId, senderKind: "User" };

  it("accepts content-only", () => {
    expect(dto.sendMessageBody.parse({ ...base, content: "hi" }).content).toBe("hi");
  });
  it("accepts attachments-only", () => {
    const parsed = dto.sendMessageBody.parse({
      ...base,
      attachments: [{ url: "/uploads/x.jpg" }],
    });
    expect(parsed.attachments.length).toBe(1);
  });
  it("rejects neither content nor attachments", () => {
    expect(() => dto.sendMessageBody.parse({ ...base })).toThrowError();
  });
  it("rejects an unknown senderKind", () => {
    expect(() =>
      dto.sendMessageBody.parse({ senderId: validId, senderKind: "Admin", content: "hi" }),
    ).toThrowError();
  });
});

describe("vendor-chats.dto.markReadBody", () => {
  it("accepts a valid participantId", () => {
    expect(dto.markReadBody.parse({ participantId: validId }).participantId).toBe(validId);
  });
  it("rejects a non-hex participantId", () => {
    expect(() => dto.markReadBody.parse({ participantId: "nope" })).toThrowError();
  });
});

describe("vendor-chats.dto.conversationParams", () => {
  it("accepts a 24-hex conversationId", () => {
    expect(dto.conversationParams.parse({ conversationId: validId }).conversationId).toBe(validId);
  });
  it("rejects a non-hex conversationId", () => {
    expect(() => dto.conversationParams.parse({ conversationId: "nope" })).toThrowError();
  });
});
