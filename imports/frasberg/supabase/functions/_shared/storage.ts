// Storage utilities for Supabase Edge Functions

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Upload generated asset to Supabase Storage
 */
export async function uploadGeneratedAsset(
  userId: string,
  binary: Uint8Array,
  fileType: string = "application/octet-stream"
): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase configuration missing");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Generate unique filename
  const fileName = `${crypto.randomUUID()}.bin`;
  const filePath = `generated/${userId}/${fileName}`;

  // Upload to storage bucket
  const { data: upload, error: uploadError } = await supabase.storage
    .from("generated-assets")
    .upload(filePath, binary, {
      contentType: fileType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from("generated-assets")
    .getPublicUrl(upload.path);

  return publicUrlData.publicUrl;
}

/**
 * Upload asset from Blob
 */
export async function uploadAssetFromBlob(
  userId: string,
  filename: string,
  blob: Blob
): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase configuration missing");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const filePath = `generated/${userId}/${filename}`;

  const { data: upload, error: uploadError } = await supabase.storage
    .from("generated-assets")
    .upload(filePath, blob, {
      contentType: blob.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from("generated-assets")
    .getPublicUrl(upload.path);

  return publicUrlData.publicUrl;
}
