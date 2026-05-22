import type { Metadata } from 'next'
import ForgotPasswordForm from '@/components/forgotPasswordForm'

export const metadata: Metadata = {
  title: 'Forgot Password — EventSphere',
  description: 'Recover your EventSphere account password',
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}
