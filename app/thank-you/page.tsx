"use client"

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ThankYouPage() {
  const router = useRouter()

  // Jika pengguna mencoba mengakses halaman ini secara langsung tanpa melalui proses upload
  useEffect(() => {
    const uploadSuccess = localStorage.getItem('uploadSuccess')
    if (uploadSuccess !== 'true') {
      router.push('/')
    }
  }, [router])

  const handleBackToHome = () => {
    // Hapus data sesi setelah selesai
    localStorage.removeItem('uploadSuccess')
    localStorage.removeItem('qrisPayloadData')
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex flex-col items-center justify-center p-4 md:p-8">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-6 md:p-10 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
          ✅ Terima Kasih!
        </h1>
        
        <p className="text-lg md:text-xl font-medium text-gray-700 mb-6">
          Pembayaran Anda telah berhasil kami terima. 🎉
        </p>
        
        <p className="text-gray-600 mb-6">
          Kami sudah menerima bukti pembayaran QRIS yang Anda upload. Tim kami akan segera melakukan verifikasi dalam beberapa saat.
        </p>
        
        <div className="bg-gray-50 rounded-lg p-4 md:p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            📌 Langkah Selanjutnya:
          </h2>
          
          <ul className="text-left space-y-2 text-gray-600">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Bukti pembayaran akan dicek maksimal 1x24 jam kerja.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Setelah terverifikasi, Anda akan menerima notifikasi melalui WhatsApp/email.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Jika ada kendala, tim kami akan langsung menghubungi Anda.</span>
            </li>
          </ul>
        </div>
        
        <p className="text-gray-600 italic mb-8">
          🙏 Terima kasih sudah bertransaksi bersama kami. Semoga layanan kami selalu bermanfaat untuk Anda.
        </p>
        
        <Button 
          onClick={handleBackToHome}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-all"
        >
          Kembali ke Beranda
        </Button>
      </div>
    </div>
  )
}