import { getSupabaseBrowserClient } from '@/services/supabase/client'
import { SUPABASE_BUCKETS } from '@/constants'

interface UploadResult {
  url: string | null
  error: string | null
}

export async function uploadEventBanner(file: File, eventId: string): Promise<UploadResult> {
  const supabase = getSupabaseBrowserClient()
  const ext = file.name.split('.').pop()
  const path = `${eventId}/banner.${ext}`

  const { error } = await supabase.storage
    .from(SUPABASE_BUCKETS.EVENTS)
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error) return { url: null, error: error.message }

  const { data } = supabase.storage.from(SUPABASE_BUCKETS.EVENTS).getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}

export async function uploadAvatar(file: File, userId: string): Promise<UploadResult> {
  const supabase = getSupabaseBrowserClient()
  const ext = file.name.split('.').pop()
  const path = `${userId}/avatar.${ext}`

  const { error } = await supabase.storage
    .from(SUPABASE_BUCKETS.AVATARS)
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error) return { url: null, error: error.message }

  const { data } = supabase.storage.from(SUPABASE_BUCKETS.AVATARS).getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}

export async function uploadOrganizerLogo(file: File, organizerId: string): Promise<UploadResult> {
  const supabase = getSupabaseBrowserClient()
  const ext = file.name.split('.').pop()
  const path = `${organizerId}/logo.${ext}`

  const { error } = await supabase.storage
    .from(SUPABASE_BUCKETS.ORGANIZERS)
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error) return { url: null, error: error.message }

  const { data } = supabase.storage.from(SUPABASE_BUCKETS.ORGANIZERS).getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}

export function getImageUrl(bucket: string, path: string): string {
  const supabase = getSupabaseBrowserClient()
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
