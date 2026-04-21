import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";

const PlantContext = createContext(null);

export function PlantProvider({ children }) {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(false);

  const [toast, setToast] = useState(null);

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
    async (id) => {
      const { error } = await supabase.from("plants").delete().eq("id", id);
      if (error) {
        console.error("Error deleting plant:", error);
        showToast("Could not remove plant.");
        return;
      }
      setPlants((ps) => ps.filter((p) => p.id !== id));
      showToast("Plant removed.");
    },
    [showToast]
  );

  const getPlant = useCallback(
    (id) => plants.find((p) => String(p.id) === String(id)) || null,
    [plants]
  );

  const loadPlants = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("plants")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading plants:", error);
      } else {
        setPlants(data || []);
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadPlants();
  }, [loadPlants]);

  return (
    <PlantContext.Provider
      value={{
        plants,
        loading,
        loadPlants,
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
