import { supabase } from "../lib/supabase";

/**
 * Slugify a plant name for use as folder name.
 * "Japanese Maple" → "japanese-maple"
 */
export function slugify(name) {
  return (name || "plant")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "plant";
}

/**
 * Upload the main plant image to the `plants` bucket.
 * Path: {slug}/main-{timestamp}.{ext}
 * Returns { publicUrl, storagePath } or null on failure.
 */
export async function uploadPlantImage(file, plantName, plantId) {
  const folder = plantId ? `${slugify(plantName)}-${plantId.slice(0, 8)}` : `${slugify(plantName)}-${Date.now()}`;
  const ext = (file.name?.split(".").pop() || file.type?.split("/")[1] || "jpg").toLowerCase();
  const filename = `main-${Date.now()}.${ext}`;
  const path = `${folder}/${filename}`;

  const { error } = await supabase.storage
    .from("plants")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) {
    console.error("Plant image upload failed:", error);
    return null;
  }

  const { data } = supabase.storage.from("plants").getPublicUrl(path);
  return { publicUrl: data.publicUrl, storagePath: path, filename };
}

/**
 * Upload a plant image from base64 data.
 * Returns { publicUrl, storagePath } or null.
 */
export async function uploadPlantImageBase64(base64, mimeType, plantName, plantId) {
  const folder = plantId ? `${slugify(plantName)}-${plantId.slice(0, 8)}` : `${slugify(plantName)}-${Date.now()}`;
  const ext = (mimeType || "image/jpeg").split("/")[1] || "jpg";
  const filename = `main-${Date.now()}.${ext}`;
  const path = `${folder}/${filename}`;

  const byteString = atob(base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
  const blob = new Blob([ab], { type: mimeType || "image/jpeg" });

  const { error } = await supabase.storage
    .from("plants")
    .upload(path, blob, { cacheControl: "3600", upsert: false });

  if (error) {
    console.error("Plant image upload failed:", error);
    return null;
  }

  const { data } = supabase.storage.from("plants").getPublicUrl(path);
  return { publicUrl: data.publicUrl, storagePath: path, filename };
}

/**
 * Upload a memory image to the `memories` bucket.
 * Path: {slug}/{date}-{slug}-{index}.{ext}
 * Returns { publicUrl, storagePath, filename } or null.
 */
export async function uploadMemoryImage(file, plantName, plantId, index = 1) {
  const slug = slugify(plantName);
  const folder = plantId ? `${slug}-${plantId.slice(0, 8)}` : `${slug}-${Date.now()}`;
  const ext = (file.name?.split(".").pop() || "jpg").toLowerCase();
  const date = new Date().toISOString().slice(0, 10);
  const filename = `${date}-${slug}-${String(index).padStart(2, "0")}.${ext}`;
  const path = `${folder}/${filename}`;

  const { error } = await supabase.storage
    .from("memories")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) {
    console.error("Memory image upload failed:", error);
    return null;
  }

  const { data } = supabase.storage.from("memories").getPublicUrl(path);
  return { publicUrl: data.publicUrl, storagePath: path, filename };
}

/**
 * Create an empty folder placeholder in the memories bucket.
 */
export async function createMemoriesFolder(plantName, plantId) {
  const slug = slugify(plantName);
  const folder = plantId ? `${slug}-${plantId.slice(0, 8)}` : `${slug}-${Date.now()}`;
  const path = `${folder}/.keep`;
  const blob = new Blob([""], { type: "text/plain" });

  await supabase.storage
    .from("memories")
    .upload(path, blob, { cacheControl: "3600", upsert: true });
}

/**
 * Insert a memory record into the plant_memories table.
 */
export async function insertMemoryRecord(plantId, { publicUrl, storagePath, filename, orderIndex = 0 }) {
  const { data, error } = await supabase
    .from("plant_memories")
    .insert({
      plant_id: plantId,
      image_url: publicUrl,
      storage_path: storagePath,
      filename,
      order_index: orderIndex,
    })
    .select()
    .single();

  if (error) {
    console.error("Insert memory record failed:", error);
    return null;
  }
  return data;
}

/**
 * Fetch all memories for a plant, ordered.
 */
export async function fetchPlantMemories(plantId) {
  const { data, error } = await supabase
    .from("plant_memories")
    .select("*")
    .eq("plant_id", plantId)
    .order("is_favorite", { ascending: false })
    .order("favorite_order", { ascending: true, nullsFirst: false })
    .order("order_index", { ascending: true });

  if (error) {
    console.error("Fetch memories failed:", error);
    return [];
  }
  return data || [];
}

/**
 * Set a memory as the thumbnail source.
 */
export async function setAsThumbnail(plantId, memoryId, imageUrl) {
  // Unset previous thumbnail source
  await supabase
    .from("plant_memories")
    .update({ is_thumbnail_source: false })
    .eq("plant_id", plantId)
    .eq("is_thumbnail_source", true);

  // Set new one
  await supabase
    .from("plant_memories")
    .update({ is_thumbnail_source: true, updated_at: new Date().toISOString() })
    .eq("id", memoryId);

  // Update plant record
  const { error } = await supabase
    .from("plants")
    .update({ thumbnail_url: imageUrl, thumbnail_memory_id: memoryId })
    .eq("id", plantId);

  return !error;
}

/**
 * Toggle favorite status on a memory. Max 5 favorites.
 */
export async function toggleFavorite(plantId, memoryId, currentFavorites) {
  const mem = currentFavorites.find((m) => m.id === memoryId);
  if (mem?.is_favorite) {
    // Remove from favorites
    await supabase
      .from("plant_memories")
      .update({ is_favorite: false, favorite_order: null, updated_at: new Date().toISOString() })
      .eq("id", memoryId);
    return true;
  }

  // Check limit
  const favCount = currentFavorites.filter((m) => m.is_favorite).length;
  if (favCount >= 5) return false; // caller should show toast

  const nextOrder = favCount + 1;
  await supabase
    .from("plant_memories")
    .update({ is_favorite: true, favorite_order: nextOrder, updated_at: new Date().toISOString() })
    .eq("id", memoryId);
  return true;
}

/**
 * Delete memories by IDs (removes from storage + DB).
 */
export async function deleteMemories(memoryRecords) {
  const storagePaths = memoryRecords.map((m) => m.storage_path).filter(Boolean);
  if (storagePaths.length) {
    await supabase.storage.from("memories").remove(storagePaths);
  }

  const ids = memoryRecords.map((m) => m.id);
  const { error } = await supabase
    .from("plant_memories")
    .delete()
    .in("id", ids);

  return !error;
}

/**
 * Reorder memories by updating order_index.
 */
export async function reorderMemories(orderedIds) {
  const updates = orderedIds.map((id, i) => ({ id, order_index: i }));
  for (const u of updates) {
    await supabase.from("plant_memories").update({ order_index: u.order_index }).eq("id", u.id);
  }
}
