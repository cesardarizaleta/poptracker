import { buildPopReportWorkbook } from "@/lib/report-export"
import type { PopReportPayload } from "@/lib/report-types"

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as PopReportPayload
    const workbook = await buildPopReportWorkbook(payload)
    return new Response(workbook, {
      headers: {
        "Content-Disposition": `attachment; filename="reporte-pop-${payload.kind}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Report export failed", error)
    return Response.json({ error: "No se pudo generar el reporte." }, { status: 500 })
  }
}
