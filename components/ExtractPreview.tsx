"use client";

import { useState } from "react";
import type { ExtractResult, FeedRecord, EventRecord } from "@/lib/schema";

type Props = {
  initial: ExtractResult;
  sourcePhoto: string;
  onSaved: () => void;
};

const FEED_TYPE_LABEL: Record<NonNullable<FeedRecord["feed_type"]>, string> = {
  breast_direct: "모유직수",
  breast_pumped: "유축",
  formula: "분유",
};

const EVENT_TYPE_LABEL: Record<EventRecord["event_type"], string> = {
  diaper_pee: "소변",
  diaper_poop: "대변",
  sleep: "수면",
  note: "메모",
};

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function ExtractPreview({ initial, sourcePhoto, onSaved }: Props) {
  const [feeds, setFeeds] = useState<FeedRecord[]>(initial.feeds);
  const [events, setEvents] = useState<EventRecord[]>(initial.events);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateFeed(i: number, patch: Partial<FeedRecord>) {
    setFeeds((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }
  function removeFeed(i: number) {
    setFeeds((prev) => prev.filter((_, idx) => idx !== i));
  }
  function addFeed() {
    setFeeds((prev) => [
      ...prev,
      {
        start_at: new Date().toISOString(),
        end_at: null,
        volume_ml: null,
        feed_type: null,
        notes: null,
      },
    ]);
  }

  function updateEvent(i: number, patch: Partial<EventRecord>) {
    setEvents((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }
  function removeEvent(i: number) {
    setEvents((prev) => prev.filter((_, idx) => idx !== i));
  }
  function addEvent() {
    setEvents((prev) => [
      ...prev,
      { event_type: "note", at: new Date().toISOString(), end_at: null, details: null },
    ]);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const calls: Promise<Response>[] = [];
      if (feeds.length > 0) {
        calls.push(
          fetch("/api/feeds", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ source_photo: sourcePhoto, feeds }),
          }),
        );
      }
      if (events.length > 0) {
        calls.push(
          fetch("/api/events", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ source_photo: sourcePhoto, events }),
          }),
        );
      }
      const results = await Promise.all(calls);
      for (const r of results) {
        if (!r.ok) {
          const body = (await r.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `HTTP ${r.status}`);
        }
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  const empty = feeds.length === 0 && events.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">수유 기록 ({feeds.length})</h2>
        {feeds.length === 0 ? (
          <p className="text-sm text-gray-500">추출된 수유 기록이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {feeds.map((f, i) => (
              <li key={i} className="rounded-lg border border-gray-200 p-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <label className="text-sm">
                    시작
                    <input
                      type="datetime-local"
                      className="mt-1 w-full rounded border px-2 py-1"
                      value={toLocalInput(f.start_at)}
                      onChange={(e) =>
                        updateFeed(i, { start_at: fromLocalInput(e.target.value) ?? f.start_at })
                      }
                    />
                  </label>
                  <label className="text-sm">
                    종료
                    <input
                      type="datetime-local"
                      className="mt-1 w-full rounded border px-2 py-1"
                      value={toLocalInput(f.end_at)}
                      onChange={(e) => updateFeed(i, { end_at: fromLocalInput(e.target.value) })}
                    />
                  </label>
                  <label className="text-sm">
                    양 (ml)
                    <input
                      type="number"
                      className="mt-1 w-full rounded border px-2 py-1"
                      value={f.volume_ml ?? ""}
                      onChange={(e) =>
                        updateFeed(i, {
                          volume_ml: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                    />
                  </label>
                  <label className="text-sm">
                    종류
                    <select
                      className="mt-1 w-full rounded border px-2 py-1"
                      value={f.feed_type ?? ""}
                      onChange={(e) =>
                        updateFeed(i, {
                          feed_type: (e.target.value || null) as FeedRecord["feed_type"],
                        })
                      }
                    >
                      <option value="">—</option>
                      {Object.entries(FEED_TYPE_LABEL).map(([v, label]) => (
                        <option key={v} value={v}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="sm:col-span-2 text-sm">
                    메모
                    <input
                      type="text"
                      className="mt-1 w-full rounded border px-2 py-1"
                      value={f.notes ?? ""}
                      onChange={(e) => updateFeed(i, { notes: e.target.value || null })}
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => removeFeed(i)}
                  className="mt-2 text-xs text-red-600 underline"
                >
                  이 기록 삭제
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={addFeed}
          className="self-start rounded border border-dashed px-3 py-1 text-sm"
        >
          + 수유 추가
        </button>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">기타 이벤트 ({events.length})</h2>
        {events.length === 0 ? (
          <p className="text-sm text-gray-500">추출된 이벤트가 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {events.map((e, i) => (
              <li key={i} className="rounded-lg border border-gray-200 p-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <label className="text-sm">
                    종류
                    <select
                      className="mt-1 w-full rounded border px-2 py-1"
                      value={e.event_type}
                      onChange={(ev) =>
                        updateEvent(i, { event_type: ev.target.value as EventRecord["event_type"] })
                      }
                    >
                      {Object.entries(EVENT_TYPE_LABEL).map(([v, label]) => (
                        <option key={v} value={v}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm">
                    시각
                    <input
                      type="datetime-local"
                      className="mt-1 w-full rounded border px-2 py-1"
                      value={toLocalInput(e.at)}
                      onChange={(ev) =>
                        updateEvent(i, { at: fromLocalInput(ev.target.value) ?? e.at })
                      }
                    />
                  </label>
                  {e.event_type === "sleep" ? (
                    <label className="text-sm">
                      종료
                      <input
                        type="datetime-local"
                        className="mt-1 w-full rounded border px-2 py-1"
                        value={toLocalInput(e.end_at)}
                        onChange={(ev) =>
                          updateEvent(i, { end_at: fromLocalInput(ev.target.value) })
                        }
                      />
                    </label>
                  ) : null}
                  <label className="sm:col-span-2 text-sm">
                    메모 / details (JSON)
                    <input
                      type="text"
                      className="mt-1 w-full rounded border px-2 py-1"
                      value={e.details ? JSON.stringify(e.details) : ""}
                      onChange={(ev) => {
                        const v = ev.target.value;
                        if (!v) return updateEvent(i, { details: null });
                        try {
                          updateEvent(i, { details: JSON.parse(v) });
                        } catch {
                          updateEvent(i, { details: { raw: v } });
                        }
                      }}
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => removeEvent(i)}
                  className="mt-2 text-xs text-red-600 underline"
                >
                  이 이벤트 삭제
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={addEvent}
          className="self-start rounded border border-dashed px-3 py-1 text-sm"
        >
          + 이벤트 추가
        </button>
      </section>

      {error ? <p className="text-sm text-red-600">저장 실패: {error}</p> : null}

      <button
        type="button"
        onClick={save}
        disabled={saving || empty}
        className="rounded-xl bg-emerald-600 px-6 py-3 font-medium text-white disabled:opacity-50"
      >
        {saving ? "저장 중…" : empty ? "저장할 항목 없음" : "저장"}
      </button>
    </div>
  );
}
