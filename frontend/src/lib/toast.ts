import { toast } from 'sonner'

export const notify = {
  success: (title: string, description?: string) =>
    toast.success(title, description ? { description } : undefined),

  error: (err: unknown, fallback = 'Something went wrong') => {
    const message = err instanceof Error ? err.message
      : typeof err === 'string' ? err
      : fallback
    toast.error(message)
  },

  loading: (title: string) => toast.loading(title),

  promise: <T>(
    p: Promise<T>,
    messages: { loading: string; success: string; error?: string }
  ) =>
    toast.promise(p, {
      loading: messages.loading,
      success: messages.success,
      error: (err) => err instanceof Error ? err.message : (messages.error ?? 'Something went wrong'),
    }),

  info: (title: string, description?: string) =>
    toast.info(title, description ? { description } : undefined),

  warning: (title: string) => toast.warning(title),
}
