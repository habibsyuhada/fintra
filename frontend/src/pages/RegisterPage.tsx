import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useRegister } from '../api/auth'
import { useAuthStore } from '../lib/auth-store'
import { isAxiosError } from 'axios'

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
    <div className="flex min-h-svh items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Daftar Fintra</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nama</label>
            <input
              {...register('name')}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input
              type="email"
              {...register('email')}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <input
              type="password"
              {...register('password')}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>
          {registerUser.isError && (
            <p className="text-sm text-red-600">
              {isAxiosError(registerUser.error) && registerUser.error.response?.data?.message
                ? String(registerUser.error.response.data.message)
                : 'Registrasi gagal'}
            </p>
          )}
          <button
            type="submit"
            disabled={registerUser.isPending}
            className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {registerUser.isPending ? 'Memproses...' : 'Daftar'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline">
            Masuk
          </Link>
        </p>
        <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4 text-center">
          <button
            onClick={() => {
              continueAsGuest()
              navigate('/')
            }}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Lanjutkan tanpa akun →
          </button>
          <p className="mt-1 text-xs text-gray-400">Data tersimpan di perangkat ini saja, tidak tersinkron ke cloud.</p>
        </div>
      </div>
    </div>
  )
}
