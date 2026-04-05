import { createClient } from './supabase-ssr';

/**
 * Sube una imagen a Supabase Storage y retorna la URL pública
 * @param file - Archivo a subir
 * @param bucket - Nombre del bucket (ej: 'locales_assets')
 * @param folder - Carpeta dentro del bucket (ej: 'logos', 'banners')
 * @param fileName - Nombre del archivo (ej: 'la-benita-1234567890.png')
 * @returns URL pública de la imagen subida
 * @throws Error si la subida falla
 */
export async function uploadImageToSupabase(
  file: File,
  bucket: string,
  folder: string,
  fileName: string
): Promise<string> {
  const supabase = createClient();

  // Construir la ruta completa del archivo
  const filePath = `${folder}/${fileName}`;

  // Subir el archivo al bucket
  const { data, error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600', // Cache por 1 hora
      upsert: false, // No sobrescribir si ya existe
    });

  if (uploadError) {
    throw new Error(`Error al subir la imagen: ${uploadError.message}`);
  }

  // Obtener la URL pública del archivo
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  if (!urlData || !urlData.publicUrl) {
    throw new Error('No se pudo obtener la URL pública de la imagen');
  }

  return urlData.publicUrl;
}

/**
 * Limpia un preview URL creado con URL.createObjectURL
 * Libera memoria del navegador
 * @param url - URL del preview a limpiar
 */
export function revokeObjectUrl(url: string | null): void {
  if (url) {
    URL.revokeObjectURL(url);
  }
}
