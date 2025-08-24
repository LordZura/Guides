import { supabase } from '../supabaseClient'

export async function uploadGuidePhotos(
  userId: string,
  files: File[]
): Promise<string[]> {
  const urls: string[] = []

  for (const file of files) {
    const fileName = `${userId}/${Date.now()}_${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('guide-photos')
      .upload(fileName, file, { cacheControl: '3600', upsert: false })
    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('guide-photos').getPublicUrl(fileName)
    if (!data?.publicUrl) throw new Error('Could not get public URL')

    urls.push(data.publicUrl)
  }

  return urls
}

export async function uploadTourPhotos(
  tourId: string,
  files: File[]
): Promise<string[]> {
  const urls: string[] = []

  for (const file of files) {
    const fileName = `${tourId}/${Date.now()}_${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('tour-photos')
      .upload(fileName, file, { cacheControl: '3600', upsert: false })
    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('tour-photos').getPublicUrl(fileName)
    if (!data?.publicUrl) throw new Error('Could not get public URL')

    urls.push(data.publicUrl)
  }

  return urls
}