import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { ActiveFilters, FilterDefinition, FilterValue } from "./AdminFilterBar";

/**
 * Puts a management page's view state in the URL.
 *
 * Every management page kept tab / search / sort / page / filters / open-record
 * in `useState`, which meant a refresh dropped an operator back to page 1 of the
 * default tab with nothing selected, and there was no way to send someone "the
 * failed payment I'm looking at" other than describing it. The state is the same
 * state; it just lives in `?q=&status=&page=&id=` now.
 *
 * This is a UI-layer hook only. It reads and writes search params — it fetches
 * nothing, and the React Query hooks in `hooks/admin/*` are untouched: pages
 * still feed these values into the same queries they always did.
 *
 * ── History behaviour ──────────────────────────────────────────────────────
 * Typing in the search box must not push a history entry per keystroke, so
 * every writer replaces the current entry — except `setSelectedId`, which
 * pushes. That is what makes Back close the drawer and land on the list rather
 * than leaving the page entirely.
 *
 * ── Serialisation ──────────────────────────────────────────────────────────
 * `select` filters are written verbatim. `date-range` is `from..to` (either end
 * may be blank). `multi-select` is `a~b~c`. Values containing `~` or `..` would
 * not round-trip, which is fine for the ids, slugs and place names these
 * filters carry — but it is the reason arrays are parsed by declared filter
 * TYPE rather than by sniffing the string.
 */

const RANGE_SEP = "..";
const MULTI_SEP = "~";

/** Only the parts of a FilterDefinition this hook needs. */
export type UrlFilterDef = Pick<FilterDefinition, "key" | "type">;

export interface UseTableUrlStateOptions {
  /** Filter definitions owned by this page. Params outside these keys are left untouched. */
  filters?: UrlFilterDef[];
  /** Tab shown when `?tab=` is absent. */
  defaultTab?: string;
  /** Sort applied when `?sort=` is absent. */
  defaultSort?: string;
}

export interface TableUrlState {
  tab: string;
  setTab: (tab: string) => void;
  q: string;
  setQ: (q: string) => void;
  sort: string;
  setSort: (sort: string) => void;
  page: number;
  setPage: (page: number) => void;
  filters: ActiveFilters;
  setFilters: (filters: ActiveFilters) => void;
  /** `?id=` — the record whose drawer is open, or null. */
  selectedId: string | null;
  /** Pushes a history entry, so Back closes the drawer. */
  setSelectedId: (id: string | null) => void;
  /** True when a search term or any filter is narrowing the list. */
  hasActiveQuery: boolean;
  /** Clears search + filters, keeps the tab. */
  clearQuery: () => void;
}

function isEmptyValue(v: FilterValue | undefined): boolean {
  if (v == null) return true;
  if (Array.isArray(v)) return v.length === 0 || v.every((x) => !x);
  return v.trim() === "";
}

function serialise(def: UrlFilterDef, value: FilterValue | undefined): string | null {
  if (isEmptyValue(value)) return null;
  if (def.type === "date-range") {
    const [from = "", to = ""] = Array.isArray(value) ? value : [String(value), ""];
    return `${from}${RANGE_SEP}${to}`;
  }
  if (def.type === "multi-select") {
    const list = Array.isArray(value) ? value : [String(value)];
    return list.filter(Boolean).join(MULTI_SEP);
  }
  return String(value);
}

function deserialise(def: UrlFilterDef, raw: string): FilterValue | null {
  if (!raw) return null;
  if (def.type === "date-range") {
    const idx = raw.indexOf(RANGE_SEP);
    // A range written by hand without the separator is treated as "from".
    if (idx === -1) return [raw, ""];
    return [raw.slice(0, idx), raw.slice(idx + RANGE_SEP.length)];
  }
  if (def.type === "multi-select") {
    const list = raw.split(MULTI_SEP).filter(Boolean);
    return list.length ? list : null;
  }
  return raw;
}

export function useTableUrlState({
  filters: filterDefs,
  defaultTab = "",
  defaultSort = "",
}: UseTableUrlStateOptions = {}): TableUrlState {
  const [searchParams, setSearchParams] = useSearchParams();

  // `searchParams` is a fresh object every render, so anything derived from it
  // has to be keyed on the serialised string — otherwise `filters` changes
  // identity on every render and every effect watching it re-fires forever.
  const paramString = searchParams.toString();

  // Same reason: filter defs are rebuilt each render (their options come from
  // loaded data), but only key+type matter here.
  const defsKey = (filterDefs ?? []).map((d) => `${d.key}:${d.type}`).join(",");
  const defs = useMemo<UrlFilterDef[]>(
    () =>
      defsKey
        ? defsKey.split(",").map((entry) => {
            const [key, type] = entry.split(":");
            return { key, type: type as FilterDefinition["type"] };
          })
        : [],
    [defsKey],
  );

  const state = useMemo(() => {
    const params = new URLSearchParams(paramString);
    const parsedFilters: ActiveFilters = {};
    for (const def of defs) {
      const raw = params.get(def.key);
      if (raw == null) continue;
      const value = deserialise(def, raw);
      if (value != null && !isEmptyValue(value)) parsedFilters[def.key] = value;
    }

    const rawPage = Number(params.get("page"));
    const q = params.get("q") ?? "";

    return {
      tab: params.get("tab") || defaultTab,
      q,
      sort: params.get("sort") || defaultSort,
      page: Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1,
      filters: parsedFilters,
      selectedId: params.get("id"),
      hasActiveQuery: !!q.trim() || Object.keys(parsedFilters).length > 0,
    };
  }, [paramString, defs, defaultTab, defaultSort]);

  /** Applies a mutation to the current params. `push` is for the drawer only. */
  const write = useCallback(
    (mutate: (params: URLSearchParams) => void, push = false) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          mutate(next);
          return next;
        },
        { replace: !push },
      );
    },
    [setSearchParams],
  );

  /** Absent params are the default, so writing "" or 1 means deleting the key. */
  const put = (params: URLSearchParams, key: string, value: string | null) => {
    if (value == null || value === "") params.delete(key);
    else params.set(key, value);
  };

  const setTab = useCallback(
    (tab: string) =>
      write((p) => {
        put(p, "tab", tab === defaultTab ? null : tab);
        // A page number belongs to the list it was counted on.
        p.delete("page");
        p.delete("id");
      }),
    [write, defaultTab],
  );

  const setQ = useCallback(
    (q: string) =>
      write((p) => {
        put(p, "q", q);
        p.delete("page");
      }),
    [write],
  );

  const setSort = useCallback(
    (sort: string) =>
      write((p) => {
        put(p, "sort", sort === defaultSort ? null : sort);
        p.delete("page");
      }),
    [write, defaultSort],
  );

  const setPage = useCallback(
    (page: number) => write((p) => put(p, "page", page > 1 ? String(page) : null)),
    [write],
  );

  const setFilters = useCallback(
    (next: ActiveFilters) =>
      write((p) => {
        for (const def of defs) put(p, def.key, serialise(def, next[def.key]));
        p.delete("page");
      }),
    [write, defs],
  );

  const setSelectedId = useCallback(
    (id: string | null) => write((p) => put(p, "id", id), true),
    [write],
  );

  const clearQuery = useCallback(
    () =>
      write((p) => {
        p.delete("q");
        for (const def of defs) p.delete(def.key);
        p.delete("page");
      }),
    [write, defs],
  );

  return {
    ...state,
    setTab,
    setQ,
    setSort,
    setPage,
    setFilters,
    setSelectedId,
    clearQuery,
  };
}

export default useTableUrlState;
