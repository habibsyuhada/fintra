import { Capacitor } from '@capacitor/core'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'

const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.72

async function compressImage(blob: Blob): Promise<File> {
  const bitmap = await createImageBitmap(blob)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas tidak didukung di perangkat ini')
  ctx.drawImage(bitmap, 0, 0, width, height)

  const compressedBlob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
  )
  if (!compressedBlob) throw new Error('Gagal mengompres gambar')
  return new File([compressedBlob], 'receipt.jpg', { type: 'image/jpeg' })
}

async function pickViaWebInput(): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) resolve(file)
      else reject(new Error('Tidak ada file dipilih'))
    }
    input.click()
  })
}

async function pickViaCapacitorCamera(): Promise<Blob> {
  const photo = await Camera.getPhoto({
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Prompt,
    quality: 85,
  })
  if (!photo.dataUrl) throw new Error('Gagal mengambil foto')
  const response = await fetch(photo.dataUrl)
  return response.blob()
}

export async function captureReceiptImage(): Promise<File> {
  const raw = Capacitor.isNativePlatform() ? await pickViaCapacitorCamera() : await pickViaWebInput()
  return compressImage(raw)
}
