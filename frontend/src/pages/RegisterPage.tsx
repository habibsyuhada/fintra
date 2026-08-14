import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useRegister } from '../api/auth'
import { useAuthStore } from '../lib/auth-store'
import { useT } from '../lib/i18n'
import { isAxiosError } from 'axios'
import { Input } from '../components/ui/Field'
import { Button } from '../components/ui/Button'
import { AuthShell } from '../components/AuthShell'

const schema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email('Email tidak valid'),
  password: z
    .string()
    .min(8, 'Minimal 8 karakter')
    .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Harus ada huruf besar, kecil, dan angka'),
})

type FormValues = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const registerUser = useRegister()
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest)
  const t = useT()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit((values) => {
    registerUser.mutate(values, {
      onSuccess: (data) =>
        navigate('/', { state: data.migratedCount > 0 ? { migratedCount: data.migratedCount } : undefined }),
    })
  })

  return (
    <AuthShell>
      <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{t('auth.registerTitle')}</h1>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{t('auth.registerSubtitle')}</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Input label={t('auth.name')} placeholder={t('auth.namePlaceholder')} {...register('name')} error={errors.name?.message} />
        <Input label={t('auth.email')} type="email" placeholder="kamu@email.com" {...register('email')} error={errors.email?.message} />
        <Input label={t('auth.password')} type="password" placeholder="••••••••" {...register('password')} error={errors.password?.message} />
        {registerUser.isError && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950 dark:text-rose-400">
            {isAxiosError(registerUser.error) && registerUser.error.response?.data?.message
              ? String(registerUser.error.response.data.message)
              : t('auth.registerFailed')}
          </p>
        )}
        <Button type="submit" loading={registerUser.isPending} className="w-full">
          {registerUser.isPending ? t('auth.registerButtonLoading') : t('auth.registerButton')}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-400">
        {t('auth.haveAccount')}{' '}
        <Link to="/login" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          {t('auth.loginLink')}
        </Link>
      </p>
      <div className="mt-5 border-t border-slate-100 pt-5 text-center dark:border-slate-800">
        <button
          onClick={() => {
            continueAsGuest()
            navigate('/')
          }}
          className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          {t('auth.continueAsGuest')}
        </button>
        <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-600">{t('auth.guestNote')}</p>
      </div>
    </AuthShell>
  )
}
