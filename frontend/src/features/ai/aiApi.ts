export type AiStatus = {
  configured: boolean;
  provider: string | null;
  model: string | null;
};

export type AiObservation = {
  title: string;
  description: string | null;
  body_region: string | null;
  significance: "normal" | "incidental" | "needs_attention" | "urgent" | null;
  confidence: number | null;
};

export type AiAnalysis = {
  id: string;
  study_id: string;
  provider: string;
  model: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  error: string | null;
  started_at: string | null;
  completed_at: string | null;
  draft: {
    findings: string;
    impression: string;
    limitations: string;
    recommendations: string[];
    series: string | null;
    slices: number;
  } | null;
  observations: AiObservation[];
};

export type AiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string | null;
};

export type AiConversation = {
  id: string;
  title: string;
  study_id: string | null;
  study_description: string | null;
  patient_name: string | null;
  patient_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  message_count: number;
  last_message: string | null;
  messages?: AiMessage[];
};

const BASE = "/api/v1/ai";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });

  if (!response.ok) {
    let message = `AI request failed (${response.status})`;
    try {
      const data = await response.json();
      if (typeof data.detail === "string") message = data.detail;
    } catch {
      // Keep the generic message.
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export const getAiStatus = () => request<AiStatus>("/status");

export const analyzeStudy = (studyId: string) =>
  request<AiAnalysis>(`/studies/${encodeURIComponent(studyId)}/analyze`, { method: "POST" });

export const listAnalyses = (studyId: string) =>
  request<{ items: AiAnalysis[] }>(`/studies/${encodeURIComponent(studyId)}/analyses`).then(
    (data) => data.items,
  );

export const listConversations = (studyId?: string) =>
  request<{ items: AiConversation[] }>(
    studyId ? `/conversations?study_id=${encodeURIComponent(studyId)}` : "/conversations",
  ).then((data) => data.items);

export const createConversation = (body: { study_id?: string | null; title?: string | null }) =>
  request<AiConversation>("/conversations", { method: "POST", body: JSON.stringify(body) });

export const getConversation = (id: string) =>
  request<AiConversation>(`/conversations/${encodeURIComponent(id)}`);

export const sendAiMessage = (id: string, content: string) =>
  request<AiConversation>(`/conversations/${encodeURIComponent(id)}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });

export async function deleteConversation(id: string) {
  const response = await fetch(`${BASE}/conversations/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error(`Could not delete conversation (${response.status})`);
}

export function formatAiTime(value: string | null) {
  return value
    ? new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
    : "";
}
