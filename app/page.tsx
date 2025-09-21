"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Copy,
  QrCode,
  AlertCircle,
  CheckCircle,
  Download,
  Clock,
  Shield,
  CreditCard,
  MessageCircle,
} from "lucide-react"
import QRCode from "qrcode"

interface QRISPayload {
  qrisEmvFinal: string
  iat: number
  exp: number
  tz: string
  expIsoJakarta: string
  canonical: string
  sig: string
  base64: string
}

function parseEMVAmount(emvString: string): number {
  try {
    // EMV QRIS uses tag-length-value format
    // Tag 54 contains the transaction amount
    const tag54Match = emvString.match(/54(\d{2})(\d+)/)
    if (tag54Match) {
      const length = Number.parseInt(tag54Match[1], 10)
      const amountStr = tag54Match[2].substring(0, length)
      return Number.parseFloat(amountStr) || 0
    }
    return 0
  } catch (error) {
    console.error("Error parsing EMV amount:", error)
    return 0
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function PaymentGatewayView({
  result,
  qrCodeUrl,
  countdown,
  downloadQRCode,
  isExpired,
}: {
  result: QRISPayload
  qrCodeUrl: string
  countdown: string
  downloadQRCode: () => void
  isExpired: (exp: number) => boolean
}) {
  const amount = parseEMVAmount(result.qrisEmvFinal)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">Complete Your Payment</h1>
          </div>
          <p className="text-center text-muted-foreground text-sm">
            Scan the QR code below to complete your transaction
          </p>
        </div>
      </div>

      {/* Main Payment Section */}
      <div className="max-w-md mx-auto px-4 py-8">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8">
            {isExpired(result.exp) ? (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">Payment Expired</h2>
                  <p className="text-muted-foreground text-sm mb-6">
                    This payment link has expired. Please request a new payment link to continue.
                  </p>
                  <Button onClick={() => window.location.reload()} className="w-full">
                    Request New Payment
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-6">
                {/* QR Code */}
                <div className="bg-white p-6 rounded-xl border-2 border-border mx-auto inline-block">
                  <img src={qrCodeUrl || "/placeholder.svg"} alt="QRIS Payment QR Code" className="w-48 h-48 mx-auto" />
                </div>

                {/* Amount Display */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Amount to Pay</p>
                  <p className="text-3xl font-bold text-foreground">{amount > 0 ? formatCurrency(amount) : "Rp 0"}</p>
                  <p className="text-sm text-muted-foreground">Via QRIS Payment</p>
                </div>

                {/* Countdown Timer */}
                {countdown && countdown !== "EXPIRED" && (
                  <div className="bg-accent/10 rounded-lg p-4">
                    <div className="flex items-center justify-center gap-2 text-accent">
                      <Clock className="w-4 h-4" />
                      <span className="font-mono text-lg font-semibold">{countdown}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Time remaining</p>
                  </div>
                )}

                {/* Konfirmasi Pembayaran Button */}
                <Button 
                  onClick={() => {
                    // Menyimpan data QRIS ke localStorage untuk diakses di halaman upload
                    localStorage.setItem('qrisPayloadData', JSON.stringify({
                      qrisEmvFinal: result.qrisEmvFinal,
                      amount: amount,
                      iat: result.iat,
                      exp: result.exp,
                      expIsoJakarta: result.expIsoJakarta,
                      canonical: result.canonical,
                      sig: result.sig,
                    }));
                    window.location.href = "/upload-bukti";
                  }} 
                  variant="primary" 
                  className="w-full bg-primary text-primary-foreground"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Konfirmasi Pembayaran
                </Button>

                {/* Security Badge */}
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>Secured by QRIS</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="payment-instructions" className="border border-border rounded-lg">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">Tata Cara Pembayaran</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-3">Cara Bayar Menggunakan QRIS:</h3>
                  <ol className="space-y-2 text-sm text-blue-800">
                    <li className="flex gap-2">
                      <span className="font-medium">1.</span>
                      <span>Buka aplikasi mobile banking atau e-wallet Anda</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-medium">2.</span>
                      <span>Pilih menu "Scan QR" atau "QRIS"</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-medium">3.</span>
                      <span>Scan QR code di atas</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-medium">4.</span>
                      <span>Periksa detail pembayaran</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-medium">5.</span>
                      <span>Konfirmasi pembayaran</span>
                    </li>
                  </ol>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="help-section" className="border border-border rounded-lg mt-2">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  <span className="font-medium">Butuh Bantuan?</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 mb-3">Jika ada masalah dengan pembayaran, hubungi admin kami:</p>
                  <Button
                    onClick={() => window.open("https://s.id/ExBjb", "_blank")}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Hubungi Admin WhatsApp
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-xs text-muted-foreground">Need help? Contact our support team</p>
        </div>
      </div>
    </div>
  )
}

function TestModeView({
  input,
  setInput,
  handleDecode,
  loading,
  error,
  result,
  qrCodeUrl,
  countdown,
  copyToClipboard,
  downloadQRCode,
  isExpired,
}: {
  input: string
  setInput: (value: string) => void
  handleDecode: () => void
  loading: boolean
  error: string
  result: QRISPayload | null
  qrCodeUrl: string
  countdown: string
  copyToClipboard: (text: string) => void
  downloadQRCode: () => void
  isExpired: (exp: number) => boolean
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <div className="text-center py-4 sm:py-8">
          <QrCode className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-indigo-600" />
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">QRIS Generator</h1>
          <p className="text-sm sm:text-base text-gray-600 px-4">
            Decode base64 payload dan generate QRIS dengan signature verification
          </p>
        </div>

        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Mode Test Aktif - Untuk development dan testing
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl">Input Payload</CardTitle>
            <CardDescription className="text-sm">
              Masukkan base64 payload atau gunakan URL dengan format: /?=eyJlbXYiOi...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="payload" className="text-sm">
                Base64 Payload atau URL Parameter
              </Label>
              <Textarea
                id="payload"
                placeholder="eyJlbXYiOi..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={3}
                className="font-mono text-xs sm:text-sm mt-2"
              />
            </div>

            <Button onClick={handleDecode} disabled={loading} className="w-full">
              {loading ? "Processing..." : "Decode & Generate QRIS"}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-800 text-base sm:text-lg">Format URL</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-700 text-xs sm:text-sm">Untuk menggunakan URL parameter, gunakan format:</p>
            <code className="block mt-2 p-2 bg-blue-100 rounded text-blue-800 text-xs font-mono break-all">
              https://yoursite.com/?=eyJlbXYiOi...
            </code>
            <p className="text-blue-600 text-xs mt-2">
              Data akan otomatis ter-decode saat halaman dimuat dengan parameter URL tersebut.
            </p>
          </CardContent>
        </Card>

        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                  <span className="flex items-center gap-2">
                    QR Code
                    {isExpired(result.exp) ? (
                      <span className="text-red-500 text-sm">(Expired)</span>
                    ) : (
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                    )}
                  </span>
                  {countdown && (
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="w-4 h-4" />
                      <span className={countdown === "EXPIRED" ? "text-red-500 font-bold" : "text-gray-600"}>
                        {countdown}
                      </span>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                {isExpired(result.exp) ? (
                  <div className="p-8 border-2 border-dashed border-red-300 rounded-lg bg-red-50">
                    <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                    <h3 className="text-lg font-semibold text-red-700 mb-2">Barcode Telah Kadaluarsa</h3>
                    <p className="text-red-600 text-sm mb-4">
                      Silakan buat barcode baru dengan payload yang masih valid
                    </p>
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-300 bg-transparent"
                      onClick={() => window.location.reload()}
                    >
                      Buat Baru
                    </Button>
                  </div>
                ) : qrCodeUrl ? (
                  <div className="space-y-4">
                    <img
                      src={qrCodeUrl || "/placeholder.svg"}
                      alt="QRIS QR Code"
                      className="mx-auto border rounded-lg max-w-full h-auto"
                      style={{ maxWidth: "256px" }}
                    />
                    <Button onClick={downloadQRCode} variant="outline" className="w-full sm:w-auto bg-transparent">
                      <Download className="w-4 h-4 mr-2" />
                      Download QR Code
                    </Button>
                    <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                      <p>Expires: {result.expIsoJakarta}</p>
                      <p>Timezone: {result.tz}</p>
                      <p>Amount: {formatCurrency(parseEMVAmount(result.qrisEmvFinal))}</p>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base sm:text-lg">QRIS Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm">EMV QRIS String</Label>
                  <div className="flex gap-2 mt-2">
                    <Input value={result.qrisEmvFinal} readOnly className="font-mono text-xs" />
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(result.qrisEmvFinal)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Issued At</Label>
                    <Input value={new Date(result.iat * 1000).toLocaleString()} readOnly className="text-xs mt-2" />
                  </div>
                  <div>
                    <Label className="text-sm">Expires At</Label>
                    <Input value={new Date(result.exp * 1000).toLocaleString()} readOnly className="text-xs mt-2" />
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Signature</Label>
                  <Input value={result.sig} readOnly className="font-mono text-xs mt-2" />
                </div>

                <div>
                  <Label className="text-sm">Canonical String</Label>
                  <Textarea value={result.canonical} readOnly rows={3} className="font-mono text-xs mt-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default function QRISGenerator() {
  const [input, setInput] = useState("")
  const [result, setResult] = useState<QRISPayload | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [countdown, setCountdown] = useState<string>("")
  const [isTestMode, setIsTestMode] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkTestMode = async () => {
      try {
        const response = await fetch("/api/config")
        const config = await response.json()
        setIsTestMode(config.testMode)
      } catch (err) {
        console.log("Test mode check failed, defaulting to false")
      }
    }
    checkTestMode()

    const urlParams = new URLSearchParams(window.location.search)
    const encodedData = urlParams.get("")

    if (!encodedData || encodedData.trim() === "") {
      router.push("/404")
      return
    }

    setInput(encodedData)
    handleDecodeWithPayload(encodedData)
  }, [router])

  useEffect(() => {
    if (!result) return

    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000)
      const timeLeft = result.exp - now

      if (timeLeft <= 0) {
        setCountdown("EXPIRED")
        return
      }

      const hours = Math.floor(timeLeft / 3600)
      const minutes = Math.floor((timeLeft % 3600) / 60)
      const seconds = timeLeft % 60

      setCountdown(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      )
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [result])

  const handleDecodeWithPayload = async (payload: string) => {
    if (!payload.trim()) {
      setError("Please enter a base64 payload or URL")
      return
    }

    setLoading(true)
    setError("")
    setResult(null)
    setQrCodeUrl("")

    try {
      const response = await fetch("/api/decode-qris", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ payload: payload.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to decode payload")
      }

      setResult(data.result)

      if (data.result.qrisEmvFinal) {
        const qrUrl = await QRCode.toDataURL(data.result.qrisEmvFinal, {
          width: 256,
          margin: 2,
        })
        setQrCodeUrl(qrUrl)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleDecode = async () => {
    await handleDecodeWithPayload(input)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const downloadQRCode = () => {
    if (!qrCodeUrl) return

    const link = document.createElement("a")
    link.download = `qris-${Date.now()}.png`
    link.href = qrCodeUrl
    link.click()
  }

  const isExpired = (exp: number) => {
    const now = Math.floor(Date.now() / 1000)
    return now >= exp
  }

  if (!isTestMode) {
    // Production Mode - Only show if we have valid result
    if (!result || !qrCodeUrl) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <QrCode className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Loading payment...</p>
          </div>
        </div>
      )
    }

    return (
      <PaymentGatewayView
        result={result}
        qrCodeUrl={qrCodeUrl}
        countdown={countdown}
        downloadQRCode={downloadQRCode}
        isExpired={isExpired}
      />
    )
  }

  // Test/Sandbox Mode - Always show test interface
  return (
    <TestModeView
      input={input}
      setInput={setInput}
      handleDecode={handleDecode}
      loading={loading}
      error={error}
      result={result}
      qrCodeUrl={qrCodeUrl}
      countdown={countdown}
      copyToClipboard={copyToClipboard}
      downloadQRCode={downloadQRCode}
      isExpired={isExpired}
    />
  )
}
