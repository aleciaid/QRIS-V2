import { type NextRequest, NextResponse } from "next/server"

interface QRISPayload {
  emv?: string
  qrisEmvFinal?: string
  iat: number
  exp: number
  tz: string
  expIsoJakarta?: string
  canonical?: string
  sig: string
  alg?: string
  base64?: string
}

function generateSignature(canonical: string, secret: string): string {
  // FNV-1a 32-bit hash implementation
  let hash = 0x811c9dc5
  const prime = 0x01000193

  for (let i = 0; i < canonical.length; i++) {
    hash ^= canonical.charCodeAt(i)
    hash = Math.imul(hash, prime)
  }

  return (hash >>> 0).toString(16).padStart(8, "0")
}

function verifySignature(payload: QRISPayload, secret: string): boolean {
  if (!payload.canonical) return false

  const expectedSig = generateSignature(payload.canonical, secret)
  return expectedSig === payload.sig
}

export async function POST(request: NextRequest) {
  try {
    const { payload } = await request.json()

    if (!payload) {
      return NextResponse.json({ error: "Payload is required" }, { status: 400 })
    }

    let base64Data = payload

    if (payload.startsWith("http")) {
      const url = new URL(payload)

      // Check for /?={{data}} format
      const emptyParam = url.searchParams.get("")
      if (emptyParam) {
        base64Data = emptyParam
      } else {
        // Fallback to other parameter names
        const base64Param = url.searchParams.get("data") || url.searchParams.get("payload")
        if (base64Param) {
          base64Data = base64Param
        } else {
          // Try to extract from path
          const pathParts = url.pathname.split("/")
          base64Data = pathParts[pathParts.length - 1]
        }
      }
    }

    if (payload.startsWith("/?=")) {
      base64Data = payload.substring(3) // Remove "/?=" prefix
    }

    // Decode base64
    let decodedData: QRISPayload
    try {
      const jsonString = Buffer.from(base64Data, "base64").toString("utf-8")
      decodedData = JSON.parse(jsonString)
    } catch (error) {
      return NextResponse.json({ error: "Invalid base64 or JSON format" }, { status: 400 })
    }

    // Get signature key from environment
    const signatureKey = process.env.QRIS_SIGNATURE_KEY || "@Sincem2k"

    // Verify signature if canonical string exists
    if (decodedData.canonical) {
      const isValidSignature = verifySignature(decodedData, signatureKey)
      if (!isValidSignature) {
        return NextResponse.json(
          {
            error: "Invalid signature",
            details: "Signature verification failed",
          },
          { status: 401 },
        )
      }
    }

    // Prepare result
    const result: QRISPayload = {
      qrisEmvFinal: decodedData.emv || decodedData.qrisEmvFinal || "",
      iat: decodedData.iat,
      exp: decodedData.exp,
      tz: decodedData.tz,
      expIsoJakarta:
        decodedData.expIsoJakarta ||
        new Date(decodedData.exp * 1000).toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }),
      canonical: decodedData.canonical || "",
      sig: decodedData.sig,
      base64: base64Data,
    }

    return NextResponse.json({
      result,
      signatureValid: true,
      message: "QRIS decoded successfully",
    })
  } catch (error) {
    console.error("Error decoding QRIS:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
