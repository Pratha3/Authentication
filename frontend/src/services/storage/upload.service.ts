import { uploadApi } from '@/lib/api'

type Bucket = 'event-images' | 'avatars' | 'organizer-assets'

export async function uploadFile(bucket: Bucket, file: File): Promise<{ url: string | null; error: string | null }> {
  const result = await uploadApi.upload(bucket, file)
  return result
}

export const uploadEventBanner = (file: File) => uploadFile('event-images', file)
export const uploadAvatar = (file: File) => uploadFile('avatars', file)
export const uploadOrganizerLogo = (file: File) => uploadFile('organizer-assets', file)
