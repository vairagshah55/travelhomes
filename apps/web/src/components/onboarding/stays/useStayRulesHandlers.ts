import React from "react";

interface UseStayRulesHandlersInput {
  setEntireStayRules: React.Dispatch<React.SetStateAction<string[]>>;
  setRoomRules: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  setOptionalRules: React.Dispatch<React.SetStateAction<string[]>>;
}

/**
 * CRUD handlers for the three rule lists on the Stay Details step:
 * - `entireStayRules`: rules shown when the host lists the whole place
 * - `roomRules`: per-room rules when listing individual rooms
 * - `optionalRules`: extra rules the host can add freely
 *
 * Returned as a stable bundle so the page just destructures.
 */
export function useStayRulesHandlers({
  setEntireStayRules,
  setRoomRules,
  setOptionalRules,
}: UseStayRulesHandlersInput) {
  const addEntireStayRule = () => setEntireStayRules((prev) => [...prev, ""]);
  const removeEntireStayRule = (index: number) =>
    setEntireStayRules((prev) => prev.filter((_, i) => i !== index));
  const updateEntireStayRule = (index: number, value: string) =>
    setEntireStayRules((prev) => prev.map((rule, i) => (i === index ? value : rule)));

  const addRoomRule = (roomId: string) =>
    setRoomRules((prev) => ({
      ...prev,
      [roomId]: [...(prev[roomId] || [""]), ""],
    }));
  const removeRoomRule = (roomId: string, index: number) =>
    setRoomRules((prev) => ({
      ...prev,
      [roomId]: (prev[roomId] || []).filter((_, i) => i !== index),
    }));
  const updateRoomRule = (roomId: string, index: number, value: string) =>
    setRoomRules((prev) => ({
      ...prev,
      [roomId]: (prev[roomId] || []).map((rule, i) => (i === index ? value : rule)),
    }));

  const addOptionalRule = () => setOptionalRules((prev) => [...prev, ""]);
  const removeOptionalRule = (index: number) =>
    setOptionalRules((prev) => prev.filter((_, i) => i !== index));
  const updateOptionalRule = (index: number, value: string) =>
    setOptionalRules((prev) => prev.map((rule, i) => (i === index ? value : rule)));

  return {
    addEntireStayRule,
    removeEntireStayRule,
    updateEntireStayRule,
    addRoomRule,
    removeRoomRule,
    updateRoomRule,
    addOptionalRule,
    removeOptionalRule,
    updateOptionalRule,
  };
}
