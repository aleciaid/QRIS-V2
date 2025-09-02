import { NextResponse } from "next/server"

export async function GET() {
  try {
    const testMode = process.env.ENABLE_TEST_MODE === "true"

    return NextResponse.json({
      testMode,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to get config" }, { status: 500 })
  }
}
