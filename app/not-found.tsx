import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, MessageCircle, Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardContent className="p-8 text-center space-y-6">
          {/* Error Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
          </div>

          {/* Error Message */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">Halaman Tidak Ditemukan</h1>
            <p className="text-slate-600 text-sm leading-relaxed">
              URL yang Anda akses tidak valid atau tidak memiliki parameter yang diperlukan.
            </p>
          </div>

          {/* Required Format Info */}
          <div className="bg-slate-50 p-4 rounded-lg border">
            <p className="text-xs text-slate-700 font-medium mb-2">Format URL yang benar:</p>
            <code className="text-xs bg-white px-2 py-1 rounded border text-slate-800">
              /?=&#123;&#123;hash_data&#125;&#125;
            </code>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              <Link
                href="https://s.id/ExBjb"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Chat Admin untuk Bantuan
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/" className="flex items-center justify-center gap-2">
                <Home className="w-4 h-4" />
                Kembali ke Beranda
              </Link>
            </Button>
          </div>

          {/* Footer Info */}
          <div className="pt-4 border-t">
            <p className="text-xs text-slate-500">Butuh bantuan? Hubungi admin melalui tombol di atas</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
