import { useCallback, useEffect, useRef, useState } from "react";
import { EventsOn } from "../../wailsjs/runtime";
import { CancelSearch, SearchFiles } from "../../wailsjs/go/main/App";
import { scanner } from "../../wailsjs/go/models";

// Mirror dari struct scanner.Result. Tipe ini tidak lagi ikut ter-generate karena
// Result hanya dipakai di payload event, bukan di signature method yang di-bind.
export type SearchResult = {
  name: string;
  path: string;
  size: number;
  modified: number;
};

export type SearchMode = "fast" | "deep";

export type SearchCriteria = {
  root: string;
  patterns: string[];
  keyword: string;
  mode: SearchMode;
  maxResults: number;
  language: string;
};

export type SearchStatus = "idle" | "scanning";

type BatchPayload = { searchId: string; results: SearchResult[] };
type DonePayload = { searchId: string; stats: scanner.SearchStats };
type ErrorPayload = { searchId: string; message: string };

function newSearchId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function useFileSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [truncated, setTruncated] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runId, setRunId] = useState("");

  const searchIdRef = useRef<string | null>(null);

  useEffect(() => {
    // searchId menentukan pemindaian mana yang boleh menulis ke state, sehingga
    // batch dari run lama yang belum selesai tidak ikut tercampur.
    const offBatch = EventsOn("search:batch", (payload: BatchPayload) => {
      if (payload.searchId !== searchIdRef.current) return;
      setResults((prev) => prev.concat(payload.results));
    });

    const offDone = EventsOn("search:done", (payload: DonePayload) => {
      if (payload.searchId !== searchIdRef.current) return;
      setTruncated(payload.stats.truncated);
      setCancelled(payload.stats.cancelled);
    });

    const offError = EventsOn("search:error", (payload: ErrorPayload) => {
      if (payload.searchId !== searchIdRef.current) return;
      setError(payload.message);
    });

    return () => {
      offBatch();
      offDone();
      offError();
    };
  }, []);

  const start = useCallback(async (criteria: SearchCriteria) => {
    const id = newSearchId();
    searchIdRef.current = id;

    setResults([]);
    setTruncated(false);
    setCancelled(false);
    setError(null);
    setStatus("scanning");
    setRunId(id);

    try {
      await SearchFiles(
        criteria.root,
        criteria.patterns,
        criteria.keyword,
        criteria.mode,
        criteria.maxResults,
        id,
      );
    } catch (err) {
      // search:error biasanya sudah mengisi ini; promise ditangkap sebagai cadangan.
      if (searchIdRef.current === id) {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (searchIdRef.current === id) setStatus("idle");
    }
  }, []);

  const cancel = useCallback(async () => {
    const id = searchIdRef.current;
    if (!id) return;
    try {
      await CancelSearch(id);
    } catch {
      // Pemindaian mungkin sudah selesai lebih dulu; tidak perlu ditampilkan.
    }
  }, []);

  return {
    results,
    status,
    truncated,
    cancelled,
    error,
    runId,
    start,
    cancel,
  };
}
