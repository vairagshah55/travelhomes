// Simple API client for Admin Marketing
const BASE = "/api/admin/marketing";

export const marketingApi = {
  list: async () => (await fetch(`${BASE}/content`)).json(),
  get: async (id: string) => (await fetch(`${BASE}/content/${id}`)).json(),
  create: async (body: { images: string[]; additionalCount?: number; content: string }) => {
    const res = await fetch(`${BASE}/content`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  },
  update: async (id: string, body: Partial<{ images: string[]; additionalCount: number; content: string }>) => {
    const res = await fetch(`${BASE}/content/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  },
  remove: async (id: string) => {
    await fetch(`${BASE}/content/${id}`, { method: "DELETE" });
  },
};