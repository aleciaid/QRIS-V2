"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  Image as ImageIcon,
  Loader2
} from "lucide-react"

export default function UploadBuktiPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    url?: string;
  } | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [])

  const handleFileSelect = (file: File) => {
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      setUploadResult({
        success: false,
        message: "Hanya file gambar yang diperbolehkan (JPG, PNG, GIF)"
      })
      return
    }
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setUploadResult({
        success: false,
        message: "Ukuran file terlalu besar (maksimal 2MB)"
      })
      return
    }

    setFile(file)
    setUploadResult(null)
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0])
    }
  }

  const uploadToImgBB = async () => {
    if (!file) return
    
    setIsUploading(true)
    setUploadResult(null)
    
    try {
      // Create form data
      const formData = new FormData()
      formData.append('image', file)
      
      // ImgBB API key - in production, this should be stored securely
      // For demo purposes, we're using a temporary key with 24-hour expiration
      const apiKey = '90d67554570cb0478cc233e3337c0ef5' // Demo key, replace with your own
      
      // Upload to ImgBB
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Mendapatkan data QRIS dari localStorage
        const qrisDataString = localStorage.getItem('qrisPayloadData')
        let qrisData = {}
        
        if (qrisDataString) {
          try {
            qrisData = JSON.parse(qrisDataString)
          } catch (e) {
            console.error('Error parsing QRIS data:', e)
          }
        }
        
        // Kirim data ke webhook
        const webhookUrl = 'https://n8n-mwtojkfm.ap-southeast-1.clawcloudrun.com/webhook/pay'
        
        // Gabungkan data QRIS dengan URL gambar
        const webhookData = {
          ...qrisData,
          imageUrl: data.data.url,
          imageDeleteUrl: data.data.delete_url,
          uploadTime: new Date().toISOString(),
          fileName: file.name,
          fileSize: file.size
        }
        
        // Kirim data ke webhook
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(webhookData)
        })
        
        if (!webhookResponse.ok) {
          console.warn('Webhook response not OK:', await webhookResponse.text())
        }
        
        setUploadResult({
          success: true,
          message: "Bukti pembayaran berhasil diunggah dan dikirim!",
          url: data.data.url
        })
      } else {
        throw new Error(data.error?.message || "Upload gagal")
      }
    } catch (error) {
      setUploadResult({
        success: false,
        message: `Gagal mengunggah gambar: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">Upload Bukti Pembayaran</h1>
          </div>
          <p className="text-center text-muted-foreground text-sm">
            Unggah bukti pembayaran Anda untuk konfirmasi transaksi
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-8">
        <Button 
          variant="outline" 
          className="mb-6 flex items-center gap-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Button>

        <Card className="border shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Upload Bukti Pembayaran</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-border"
              } ${preview ? "bg-muted/20" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {preview ? (
                <div className="space-y-4">
                  <div className="relative mx-auto max-w-xs overflow-hidden rounded-lg">
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="mx-auto max-h-64 object-contain"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {file?.name} ({(file?.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setFile(null)
                      setPreview(null)
                    }}
                  >
                    Ganti Gambar
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Tarik dan lepas gambar di sini atau
                    </p>
                    <Label
                      htmlFor="file-upload"
                      className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      Pilih File
                    </Label>
                    <Input
                      id="file-upload"
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleFileInputChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: JPG, PNG, GIF (Maks. 2MB)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Upload Result Alert */}
            {uploadResult && (
              <Alert variant={uploadResult.success ? "default" : "destructive"}>
                <div className="flex items-center gap-2">
                  {uploadResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>{uploadResult.message}</AlertDescription>
                </div>
              </Alert>
            )}

            {/* Upload Button */}
            <Button 
              className="w-full" 
              disabled={!file || isUploading || (uploadResult?.success ?? false)}
              onClick={uploadToImgBB}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengunggah...
                </>
              ) : uploadResult?.success ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Berhasil Diunggah
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Bukti Pembayaran
                </>
              )}
            </Button>

            {/* Success Action */}
            {uploadResult?.success && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push("/")}
              >
                Kembali ke Halaman Utama
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}