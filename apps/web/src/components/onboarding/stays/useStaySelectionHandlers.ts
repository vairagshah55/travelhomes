import React from "react";
import { toast } from "sonner";

interface Room {
  id: string;
  name: string;
  description: string;
  photos: string[];
  guestCapacity: number;
  beds: number;
  bathrooms: number;
  price: number;
}

interface UseStaySelectionHandlersInput {
  // Property selection (Step 0)
  setSelectedProperties: React.Dispatch<React.SetStateAction<string[]>>;

  // Feature selection (Step 3)
  setSelectedFeatures: React.Dispatch<React.SetStateAction<string[]>>;
  showCustomFeaturesInput: boolean;
  setShowCustomFeaturesInput: React.Dispatch<React.SetStateAction<boolean>>;

  // Rooms (Step 2 — individual stays)
  rooms: Room[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  setNumberOfRooms: React.Dispatch<React.SetStateAction<number>>;
}

/**
 * Property/feature selection toggles + room CRUD + counter increment/decrement
 * for the Stay onboarding flow.
 *
 * `incrementValue`/`decrementValue` are stable references so they can be
 * forwarded to the counter UI inside StayDetailsStep without re-creating on
 * every render.
 */
export function useStaySelectionHandlers({
  setSelectedProperties,
  setSelectedFeatures,
  showCustomFeaturesInput,
  setShowCustomFeaturesInput,
  rooms,
  setRooms,
  setNumberOfRooms,
}: UseStaySelectionHandlersInput) {
  const togglePropertySelection = (propertyId: string) => {
    setSelectedProperties((prev) => {
      if (prev.includes(propertyId)) return prev.filter((id) => id !== propertyId);
      if (prev.length >= 5) {
        toast.error("Maximum 5 properties can be selected");
        return prev;
      }
      return [...prev, propertyId];
    });
  };

  const toggleFeatureSelection = (featureId: string) => {
    if (featureId === "others") {
      setShowCustomFeaturesInput(!showCustomFeaturesInput);
      return;
    }
    setSelectedFeatures((prev) =>
      prev.includes(featureId)
        ? prev.filter((id) => id !== featureId)
        : [...prev, featureId],
    );
  };

  const incrementValue = (
    value: number,
    setter: (val: number) => void,
    max: number = 20,
  ) => {
    const safe = isFinite(value) ? value : 0;
    if (safe < max) setter(safe + 1);
  };

  const decrementValue = (
    value: number,
    setter: (val: number) => void,
    min: number = 1,
  ) => {
    const safe = isFinite(value) ? value : 0;
    if (safe > min) setter(safe - 1);
  };

  const addRoom = () => {
    const newRoom: Room = {
      id: (rooms.length + 1).toString(),
      name: "",
      description: "",
      photos: [],
      guestCapacity: 1,
      beds: 1,
      bathrooms: 1,
      price: 5934,
    };
    setRooms([...rooms, newRoom]);
    setNumberOfRooms(rooms.length + 1);
  };

  const removeRoom = () => {
    if (rooms.length > 1) {
      setRooms(rooms.slice(0, -1));
      setNumberOfRooms(rooms.length - 1);
    }
  };

  const updateRoom = (id: string, field: keyof Room, value: any) =>
    setRooms((prev) =>
      prev.map((room) => (room.id === id ? { ...room, [field]: value } : room)),
    );

  return {
    togglePropertySelection,
    toggleFeatureSelection,
    incrementValue,
    decrementValue,
    addRoom,
    removeRoom,
    updateRoom,
  };
}
