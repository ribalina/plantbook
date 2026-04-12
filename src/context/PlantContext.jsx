import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { SEEDS } from "../data/seeds";

const PlantContext = createContext(null);

export function PlantProvider({ children }) {
  const [plants, setPlants] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("pc_plants_v2")) || SEEDS;
    } catch {
      return SEEDS;
    }
  });

  const [toast, setToast] = useState(null);

  useEffect(() => {
    localStorage.setItem("pc_plants_v2", JSON.stringify(plants));
  }, [plants]);

  const showToast = useCallback((msg) => setToast(msg), []);
  const clearToast = useCallback(() => setToast(null), []);

  const savePlant = useCallback(
    (plant) => {
      setPlants((ps) => {
        const exists = ps.find((p) => p.id === plant.id);
        return exists
          ? ps.map((p) => (p.id === plant.id ? plant : p))
          : [...ps, plant];
      });
    },
    []
  );

  const deletePlant = useCallback(
    (id) => {
      setPlants((ps) => ps.filter((p) => p.id !== id));
      showToast("Plant removed.");
    },
    [showToast]
  );

  const getPlant = useCallback(
    (id) => plants.find((p) => String(p.id) === String(id)) || null,
    [plants]
  );

  return (
    <PlantContext.Provider
      value={{
        plants,
        savePlant,
        deletePlant,
        getPlant,
        toast,
        showToast,
        clearToast,
      }}
    >
      {children}
    </PlantContext.Provider>
  );
}

export function usePlants() {
  const ctx = useContext(PlantContext);
  if (!ctx) throw new Error("usePlants must be used within PlantProvider");
  return ctx;
}
