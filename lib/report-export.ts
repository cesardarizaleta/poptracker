import ExcelJS from "exceljs"
import JSZip from "jszip"
import path from "node:path"

import type { PopReportPayload } from "@/lib/report-types"

const COLORS = {
  navy: "00338D",
  blue: "005CA9",
  ink: "102543",
  muted: "60738E",
  pale: "F5F8FC",
  lightBlue: "EAF2FB",
  line: "D6E1F0",
  yellow: "F4C542",
  green: "4F922D",
  white: "FFFFFF",
}
const FONT = "Aptos"

type ChartSpec = {
  title: string
  type: "bar" | "line"
  categoryRange: string
  valueRange: string
  seriesName: string
  categories: string[]
  values: number[]
  from: { col: number; row: number }
  to: { col: number; row: number }
  color: string
  numberFormatCode: string
}

function safeSheetName(name: string) {
  return name.replace(/'/g, "''")
}

function excelText(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function excelColumn(index: number) {
  let value = index + 1
  let result = ""
  while (value > 0) {
    const remainder = (value - 1) % 26
    result = String.fromCharCode(65 + remainder) + result
    value = Math.floor((value - 1) / 26)
  }
  return result
}

function setSheetDefaults(sheet: ExcelJS.Worksheet, tabColor: string) {
  sheet.properties.tabColor = { argb: tabColor }
  sheet.views = [{ state: "frozen", ySplit: 7, showGridLines: false }]
}

function styleTitle(sheet: ExcelJS.Worksheet, title: string, subtitle: string) {
  sheet.mergeCells("A1:H1")
  sheet.getCell("A1").value = title
  sheet.getCell("A1").font = { name: FONT, size: 16, bold: true, color: { argb: COLORS.navy } }
  sheet.getCell("A1").alignment = { vertical: "middle" }
  sheet.getRow(1).height = 28
  sheet.mergeCells("A2:H2")
  sheet.getCell("A2").value = subtitle
  sheet.getCell("A2").font = { name: FONT, size: 10, italic: true, color: { argb: COLORS.muted } }
  sheet.getRow(2).height = 20
  sheet.getRow(4).height = 8
}

function styleHeader(row: ExcelJS.Row) {
  row.height = 22
  row.eachCell((cell) => {
    cell.font = { name: FONT, size: 10, bold: true, color: { argb: COLORS.white } }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.navy } }
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true }
    cell.border = { bottom: { style: "thin", color: { argb: COLORS.white } } }
  })
}

function styleBody(sheet: ExcelJS.Worksheet, startRow: number, endRow: number, endColumn: number) {
  for (let rowIndex = startRow; rowIndex <= endRow; rowIndex += 1) {
    const row = sheet.getRow(rowIndex)
    row.height = 20
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { name: FONT, size: 10, color: { argb: COLORS.ink } }
      cell.alignment = { vertical: "middle" }
      if (rowIndex % 2 === 0) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F7FAFE" } }
    })
    sheet.getRow(rowIndex).getCell(endColumn).alignment = { horizontal: "right", vertical: "middle" }
  }
}

function addTable(sheet: ExcelJS.Worksheet, name: string, headerRow: number, endRow: number, endColumn: number) {
  sheet.autoFilter = { from: `A${headerRow}`, to: `${excelColumn(endColumn - 1)}${endRow}` }
  return name
}

function formulaWithResult(formula: string, result: string | number) {
  return { formula, result }
}

function selectedCampaignFormula(row: number, column: string, value: string | number, filterCell = "Filtros!$B$6") {
  const escapedValue = typeof value === "number" ? String(value) : `"${value.replace(/"/g, '""')}"`
  return formulaWithResult(`=IF(OR(${filterCell}="Todas",$A${row}=${filterCell}),${escapedValue},"")`, value)
}

function selectedTerritoryFormula(row: number, value: number, filterCell = "Filtros!$B$5") {
  return formulaWithResult(`=IF(OR(${filterCell}="Todos",$A${row}=${filterCell}),${value},"")`, value)
}

function addCampaignSheet(workbook: ExcelJS.Workbook, payload: PopReportPayload) {
  const sheet = workbook.addWorksheet("Campañas")
  setSheetDefaults(sheet, COLORS.blue)
  styleTitle(sheet, "Campañas POP", `Cobertura, entregas, leads e ingreso · período ${payload.period}`)
  sheet.getRow(7).values = ["Campaña", "Marca", "Estado", "Cobertura", "Entregas", "Meta", "Leads", "Ingreso atribuible"]
  styleHeader(sheet.getRow(7))
  payload.campaigns.forEach((campaign, index) => {
    const row = 8 + index
    sheet.getRow(row).values = [campaign.name, campaign.brand, campaign.status, selectedCampaignFormula(row, "D", campaign.coverage), selectedCampaignFormula(row, "E", campaign.delivered), campaign.goal, selectedCampaignFormula(row, "G", campaign.leads), selectedCampaignFormula(row, "H", campaign.revenue)]
  })
  styleBody(sheet, 8, 7 + payload.campaigns.length, 8)
  sheet.getColumn(1).width = 30
  sheet.getColumn(2).width = 18
  sheet.getColumn(3).width = 15
  sheet.getColumn(4).width = 14
  sheet.getColumn(5).width = 14
  sheet.getColumn(6).width = 14
  sheet.getColumn(7).width = 12
  sheet.getColumn(8).width = 22
  sheet.getColumn(4).numFmt = "0%"
  sheet.getColumn(8).numFmt = '#,##0 "Bs."'
  addTable(sheet, "CampañasPopTable", 7, 7 + payload.campaigns.length, 8)
}

function addInventorySheet(workbook: ExcelJS.Workbook, payload: PopReportPayload) {
  const sheet = workbook.addWorksheet("Inventario POP")
  setSheetDefaults(sheet, COLORS.blue)
  styleTitle(sheet, "Inventario POP", `Disponibilidad, reserva y reposición · actualizado ${new Date(payload.generatedAt).toLocaleDateString("es-VE")}`)
  sheet.getRow(7).values = ["SKU", "Material", "Categoría", "Campaña", "Disponible", "Reservado", "Libre", "Punto de reposición", "Estado"]
  styleHeader(sheet.getRow(7))
  payload.materials.forEach((material, index) => {
    const row = 8 + index
    const free = Math.max(0, material.available - material.reserved)
    sheet.getRow(row).values = [material.sku, material.name, material.category, material.campaign, material.available, material.reserved, free, material.reorderPoint, free <= material.reorderPoint ? "Atención" : "Disponible"]
  })
  const endRow = 7 + payload.materials.length
  styleBody(sheet, 8, endRow, 9)
  sheet.getColumn(1).width = 20
  sheet.getColumn(2).width = 36
  sheet.getColumn(3).width = 18
  sheet.getColumn(4).width = 30
  for (let columnIndex = 5; columnIndex <= 8; columnIndex += 1) {
    sheet.getColumn(columnIndex).width = 16
    sheet.getColumn(columnIndex).numFmt = "#,##0"
  }
  sheet.getColumn(9).width = 16
  sheet.getColumn(9).eachCell((cell, rowNumber) => { if (rowNumber >= 8 && cell.value === "Atención") cell.font = { name: FONT, size: 10, bold: true, color: { argb: "8A5600" } } })
  addTable(sheet, "InventarioPopTable", 7, endRow, 9)
}

function addDeliveriesSheet(workbook: ExcelJS.Workbook, payload: PopReportPayload) {
  const sheet = workbook.addWorksheet("Detalle entregas")
  setSheetDefaults(sheet, COLORS.blue)
  styleTitle(sheet, "Detalle de entregas", "Registro exportado del panel operativo con filtros de Excel habilitados")
  sheet.getRow(7).values = ["ID", "Tipo", "Detalle", "Cantidad", "Vendedor", "Ubicación", "Estado", "Marca de tiempo"]
  styleHeader(sheet.getRow(7))
  payload.activities.forEach((activity, index) => {
    const row = 8 + index
    const amountMatch = activity.title.match(/[\d.]+/)
    const amount = amountMatch ? Number(amountMatch[0].replace(/\./g, "")) : null
    sheet.getRow(row).values = [activity.id, activity.type, activity.detail, amount, payload.profile.fullName, payload.profile.territory, activity.status, activity.time]
  })
  const endRow = Math.max(7 + payload.activities.length, 8)
  styleBody(sheet, 8, endRow, 8)
  sheet.getColumn(1).width = 24
  sheet.getColumn(2).width = 15
  sheet.getColumn(3).width = 42
  sheet.getColumn(4).width = 14
  sheet.getColumn(5).width = 22
  sheet.getColumn(6).width = 28
  sheet.getColumn(7).width = 15
  sheet.getColumn(8).width = 18
  sheet.getColumn(4).numFmt = "#,##0"
  addTable(sheet, "DetalleEntregasTable", 7, endRow, 8)
}

function addCoverageSheet(workbook: ExcelJS.Workbook, payload: PopReportPayload) {
  const sheet = workbook.addWorksheet("Cobertura")
  setSheetDefaults(sheet, COLORS.blue)
  styleTitle(sheet, "Cobertura territorial", "Ejecución, puntos de venta, leads y pendientes por plaza")
  sheet.getRow(7).values = ["Territorio", "Código", "PDV activos", "Ejecución", "Leads", "Stock asignable", "Pendientes", "Campaña dominante", "Vendedor líder", "Señal"]
  styleHeader(sheet.getRow(7))
  payload.territories.forEach((territory, index) => {
    const row = 8 + index
    sheet.getRow(row).values = [territory.name, territory.code, territory.pdv, selectedTerritoryFormula(row, territory.delivered / 100), territory.leads, territory.stock, territory.pending, territory.campaign, territory.seller, territory.signal]
  })
  const endRow = 7 + payload.territories.length
  styleBody(sheet, 8, endRow, 10)
  sheet.getColumn(1).width = 28
  sheet.getColumn(2).width = 12
  sheet.getColumn(3).width = 14
  sheet.getColumn(4).width = 14
  sheet.getColumn(5).width = 12
  sheet.getColumn(6).width = 20
  sheet.getColumn(7).width = 14
  sheet.getColumn(8).width = 32
  sheet.getColumn(9).width = 22
  sheet.getColumn(10).width = 22
  sheet.getColumn(4).numFmt = "0%"
  sheet.getColumn(3).numFmt = "#,##0"
  sheet.getColumn(5).numFmt = "#,##0"
  sheet.getColumn(7).numFmt = "#,##0"
  addTable(sheet, "CoberturaPopTable", 7, endRow, 10)
}

function addActivitySheet(workbook: ExcelJS.Workbook, payload: PopReportPayload) {
  const sheet = workbook.addWorksheet("Actividad")
  setSheetDefaults(sheet, COLORS.blue)
  styleTitle(sheet, "Actividad reciente", "Auditoría visible de los movimientos cargados en el panel")
  sheet.getRow(7).values = ["ID", "Tipo", "Título", "Detalle", "Hora", "Estado"]
  styleHeader(sheet.getRow(7))
  payload.activities.forEach((activity, index) => { sheet.getRow(8 + index).values = [activity.id, activity.type, activity.title, activity.detail, activity.time, activity.status] })
  const endRow = Math.max(7 + payload.activities.length, 8)
  styleBody(sheet, 8, endRow, 6)
  sheet.getColumn(1).width = 24
  sheet.getColumn(2).width = 16
  sheet.getColumn(3).width = 34
  sheet.getColumn(4).width = 44
  sheet.getColumn(5).width = 18
  sheet.getColumn(6).width = 16
  addTable(sheet, "ActividadPopTable", 7, endRow, 6)
}

function addFiltersSheet(workbook: ExcelJS.Workbook, payload: PopReportPayload) {
  const sheet = workbook.addWorksheet("Filtros")
  setSheetDefaults(sheet, COLORS.yellow)
  sheet.views = [{ state: "frozen", ySplit: 3 }]
  styleTitle(sheet, "Filtros del reporte", "Edita las celdas amarillas para cambiar el resumen y las gráficas al abrir el archivo")
  sheet.getColumn(1).width = 24
  sheet.getColumn(2).width = 30
  sheet.getColumn(4).width = 62
  sheet.getRow(5).values = ["Territorio", "Todos"]
  sheet.getRow(6).values = ["Campaña", "Todas"]
  sheet.getRow(7).values = ["Período", payload.period]
  for (const row of [5, 6, 7]) {
    sheet.getCell(`A${row}`).font = { name: FONT, size: 10, bold: true, color: { argb: COLORS.ink } }
    sheet.getCell(`B${row}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF4CC" } }
    sheet.getCell(`B${row}`).font = { name: FONT, size: 10, bold: true, color: { argb: COLORS.navy } }
    sheet.getCell(`B${row}`).border = { bottom: { style: "thin", color: { argb: "D9AC1E" } } }
  }
  sheet.getCell("B5").dataValidation = { type: "list", allowBlank: false, formulae: [`"Todos,${payload.territories.map((territory) => territory.name.replace(/,/g, " ")).join(",")}"`] }
  sheet.getCell("B6").dataValidation = { type: "list", allowBlank: false, formulae: [`"Todas,${payload.campaigns.map((campaign) => campaign.name.replace(/,/g, " ")).join(",")}"`] }
  sheet.getCell("B7").dataValidation = { type: "list", allowBlank: false, formulae: ['"Semana,Mes,Trimestre"'] }
  sheet.getCell("D5").value = "Controles"
  sheet.getCell("D5").font = { name: FONT, size: 11, bold: true, color: { argb: COLORS.navy } }
  sheet.getCell("D6").value = "Los filtros controlan las tablas de resumen y las gráficas del dashboard. Las tablas de detalle también cuentan con filtros nativos de Excel."
  sheet.getCell("D6").alignment = { wrapText: true, vertical: "top" }
  sheet.getCell("D6").font = { name: FONT, size: 10, color: { argb: COLORS.muted } }
  sheet.getRow(6).height = 42
}

function addSummarySheet(workbook: ExcelJS.Workbook, payload: PopReportPayload, logoPath: string) {
  const sheet = workbook.addWorksheet("Resumen ejecutivo")
  setSheetDefaults(sheet, COLORS.navy)
  sheet.views = [{ state: "normal" }]
  sheet.getColumn(1).width = 30
  sheet.getColumn(2).width = 18
  sheet.getColumn(3).width = 18
  sheet.getColumn(4).width = 18
  sheet.getColumn(5).width = 18
  sheet.getColumn(6).width = 18
  sheet.getColumn(7).width = 18
  sheet.getColumn(8).width = 18
  sheet.getColumn(9).width = 3
  sheet.getColumn(10).width = 16
  sheet.getColumn(11).width = 16
  sheet.getColumn(12).width = 16
  sheet.mergeCells("A1:H1")
  sheet.getCell("A1").value = "REPORTE EJECUTIVO POP"
  sheet.getCell("A1").font = { name: FONT, size: 18, bold: true, color: { argb: COLORS.navy } }
  sheet.getCell("A1").alignment = { vertical: "middle" }
  sheet.getRow(1).height = 30
  sheet.mergeCells("A2:H2")
  sheet.getCell("A2").value = `Empresas Polar · ${payload.profile.fullName} · ${payload.profile.territory} · período ${payload.period}`
  sheet.getCell("A2").font = { name: FONT, size: 10, italic: true, color: { argb: COLORS.muted } }
  sheet.getRow(2).height = 20
  const imageId = workbook.addImage({ filename: logoPath, extension: "png" })
  sheet.addImage(imageId, { tl: { col: 9, row: 0 }, ext: { width: 170, height: 58 } })

  const campaignDataEnd = 7 + payload.campaigns.length
  sheet.getRow(5).values = ["Entregas trazables", formulaWithResult(`=IF(Filtros!$B$6="Todas",${payload.deliveredUnits},IFERROR(SUMIF('Campañas'!$A$8:$A$${campaignDataEnd},Filtros!$B$6,'Campañas'!$E$8:$E$${campaignDataEnd}),0))`, payload.deliveredUnits), "Inventario libre", formulaWithResult(`=SUM('Inventario POP'!$G$8:$G$${Math.max(8 + payload.materials.length - 1, 8)})`, payload.freeStock), "Leads atribuidos", formulaWithResult(`=IF(Filtros!$B$6="Todas",${payload.leadCount},IFERROR(SUMIF('Campañas'!$A$8:$A$${campaignDataEnd},Filtros!$B$6,'Campañas'!$G$8:$G$${campaignDataEnd}),0))`, payload.leadCount), "Ingreso atribuible", formulaWithResult(`=IF(Filtros!$B$6="Todas",${payload.attributedRevenue},IFERROR(SUMIF('Campañas'!$A$8:$A$${campaignDataEnd},Filtros!$B$6,'Campañas'!$H$8:$H$${campaignDataEnd}),0))`, payload.attributedRevenue)]
  sheet.getRow(6).values = ["Corte operativo", payload.period, "Stock disponible", `${Math.round((payload.freeStock / Math.max(payload.inventoryValue, 1)) * 100)}%`, "Campañas activas", payload.campaigns.filter((campaign) => campaign.status === "Activa").length, "Fuente", "Panel POP / Supabase"]
  for (const cellAddress of ["A5", "C5", "E5", "G5"]) {
    const label = sheet.getCell(cellAddress)
    label.font = { name: FONT, size: 9, bold: true, color: { argb: COLORS.muted } }
  }
  for (const cellAddress of ["B5", "D5", "F5", "H5"]) {
    const value = sheet.getCell(cellAddress)
    value.font = { name: FONT, size: 16, bold: true, color: { argb: COLORS.navy } }
    value.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.lightBlue } }
    value.alignment = { horizontal: "right", vertical: "middle" }
  }
  sheet.getCell("H5").numFmt = '#,##0 "Bs."'
  sheet.getCell("B5").numFmt = "#,##0"
  sheet.getCell("D5").numFmt = "#,##0"
  sheet.getCell("F5").numFmt = "#,##0"
  sheet.getRow(5).height = 34
  sheet.getRow(6).font = { name: FONT, size: 10, color: { argb: COLORS.muted } }
  sheet.getRow(6).alignment = { vertical: "middle" }

  sheet.getCell("A10").value = "Rendimiento por campaña"
  sheet.getCell("A10").font = { name: FONT, size: 12, bold: true, color: { argb: COLORS.navy } }
  sheet.getRow(13).values = ["Campaña", "Cobertura", "Entregas", "Leads", "Ingreso atribuible"]
  styleHeader(sheet.getRow(13))
  payload.campaigns.forEach((campaign, index) => {
    const row = 14 + index
    sheet.getRow(row).values = [campaign.name, selectedCampaignFormula(row, "B", campaign.coverage / 100), selectedCampaignFormula(row, "C", campaign.delivered), selectedCampaignFormula(row, "D", campaign.leads), selectedCampaignFormula(row, "E", campaign.revenue)]
  })
  const campaignEnd = 13 + payload.campaigns.length
  styleBody(sheet, 14, campaignEnd, 5)
  sheet.getColumn(2).numFmt = "0%"
  sheet.getColumn(3).numFmt = "#,##0"
  sheet.getColumn(4).numFmt = "#,##0"
  sheet.getColumn(5).numFmt = '#,##0 "Bs."'
  addTable(sheet, "DashboardCampañasTable", 13, campaignEnd, 5)

  sheet.getCell("A23").value = "Rendimiento por territorio"
  sheet.getCell("A23").font = { name: FONT, size: 12, bold: true, color: { argb: COLORS.navy } }
  sheet.getRow(26).values = ["Territorio", "Ejecución", "PDV activos", "Leads", "Pendientes"]
  styleHeader(sheet.getRow(26))
  payload.territories.forEach((territory, index) => {
    const row = 27 + index
    sheet.getRow(row).values = [territory.name, selectedTerritoryFormula(row, territory.delivered / 100), territory.pdv, territory.leads, territory.pending]
  })
  const territoryEnd = 26 + payload.territories.length
  styleBody(sheet, 27, territoryEnd, 5)
  sheet.getColumn(2).numFmt = "0%"
  sheet.getColumn(3).numFmt = "#,##0"
  sheet.getColumn(4).numFmt = "#,##0"
  sheet.getColumn(5).numFmt = "#,##0"
  addTable(sheet, "DashboardTerritoriosTable", 26, territoryEnd, 5)

  sheet.getCell("A35").value = "Nota de uso"
  sheet.getCell("A35").font = { name: FONT, size: 10, bold: true, color: { argb: COLORS.navy } }
  sheet.mergeCells("A36:H36")
  sheet.getCell("A36").value = "Usa la hoja Filtros para cambiar territorio, campaña y período. Las tablas de detalle tienen filtros nativos para profundizar el análisis."
  sheet.getCell("A36").font = { name: FONT, size: 10, italic: true, color: { argb: COLORS.muted } }
  sheet.getCell("A36").alignment = { wrapText: true, vertical: "middle" }
  sheet.getRow(36).height = 32

  const chartSheet = sheet as ExcelJS.Worksheet & { __polarCharts?: ChartSpec[] }
  chartSheet.__polarCharts = [
    { title: "Cobertura por campaña", type: "bar", categoryRange: `$A$14:$A$${campaignEnd}`, valueRange: `$B$14:$B$${campaignEnd}`, seriesName: "Cobertura", categories: payload.campaigns.map((campaign) => campaign.name), values: payload.campaigns.map((campaign) => campaign.coverage / 100), from: { col: 6, row: 9 }, to: { col: 12, row: 23 }, color: COLORS.blue, numberFormatCode: "0%" },
    { title: "Entregas por campaña", type: "bar", categoryRange: `$A$14:$A$${campaignEnd}`, valueRange: `$C$14:$C$${campaignEnd}`, seriesName: "Entregas", categories: payload.campaigns.map((campaign) => campaign.name), values: payload.campaigns.map((campaign) => campaign.delivered), from: { col: 6, row: 24 }, to: { col: 12, row: 38 }, color: COLORS.navy, numberFormatCode: "#,##0" },
  ] as ChartSpec[]
  sheet.views = [{ state: "normal", showGridLines: false }]
}

function chartTitleXml(title: string) {
  return `<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr/></a:pPr><a:r><a:rPr lang="es-VE" sz="1100"/><a:t>${excelText(title)}</a:t></a:r><a:endParaRPr lang="es-VE"/></a:p></c:rich></c:tx><c:layout/><c:overlay val="0"/></c:title>`
}

function buildChartXml(spec: ChartSpec, sheetName: string, chartIndex: number) {
  const escapedSheet = safeSheetName(sheetName)
  const categoryFormula = `'${escapedSheet}'!${spec.categoryRange}`
  const valueFormula = `'${escapedSheet}'!${spec.valueRange}`
  const points = spec.values.map((value, index) => `<c:pt idx="${index}"><c:v>${value}</c:v></c:pt>`).join("")
  const categoryPoints = spec.categories.map((value, index) => `<c:pt idx="${index}"><c:v>${excelText(value)}</c:v></c:pt>`).join("")
  const series = `<c:ser><c:idx val="0"/><c:order val="0"/><c:tx><c:v>${excelText(spec.seriesName)}</c:v></c:tx><c:spPr><a:solidFill><a:srgbClr val="${spec.color}"/></a:solidFill><a:ln><a:solidFill><a:srgbClr val="${spec.color}"/></a:solidFill></a:ln></c:spPr><c:cat><c:strRef><c:f>${categoryFormula}</c:f><c:strCache><c:ptCount val="${spec.categories.length}"/>${categoryPoints}</c:strCache></c:strRef></c:cat><c:val><c:numRef><c:f>${valueFormula}</c:f><c:numCache><c:formatCode>${spec.numberFormatCode}</c:formatCode><c:ptCount val="${spec.values.length}"/>${points}</c:numCache></c:numRef></c:val></c:ser>`
  const chartType = spec.type === "line" ? `<c:lineChart><c:grouping val="standard"/>${series}<c:axId val="${100 + chartIndex}"/><c:axId val="${200 + chartIndex}"/></c:lineChart>` : `<c:barChart><c:barDir val="col"/><c:grouping val="clustered"/><c:varyColors val="0"/>${series}<c:axId val="${100 + chartIndex}"/><c:axId val="${200 + chartIndex}"/></c:barChart>`
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><c:date1904 val="0"/><c:lang val="es-VE"/><c:roundedCorners val="0"/><c:style val="10"/><c:chart>${chartTitleXml(spec.title)}<c:plotArea><c:layout/>${chartType}<c:catAx><c:axId val="${100 + chartIndex}"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:crossAx val="${200 + chartIndex}"/><c:crosses val="autoZero"/><c:tickLblPos val="low"/></c:catAx><c:valAx><c:axId val="${200 + chartIndex}"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="l"/><c:numFmt formatCode="${spec.numberFormatCode}" sourceLinked="0"/><c:crossAx val="${100 + chartIndex}"/><c:crosses val="autoZero"/><c:crossBetween val="midCat"/></c:valAx></c:plotArea><c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart></c:chartSpace>`
}

function buildChartAnchorsXml(specs: ChartSpec[], firstRelationshipId: number) {
  return specs.map((spec, index) => `<xdr:twoCellAnchor editAs="oneCell"><xdr:from><xdr:col>${spec.from.col}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${spec.from.row}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:to><xdr:col>${spec.to.col}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${spec.to.row}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to><xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="${index + 2}" name="Chart ${index + 1}"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart r:id="rId${firstRelationshipId + index}"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor>`).join("")
}

async function addNativeCharts(buffer: ArrayBuffer, specs: ChartSpec[], sheetIndex: number, sheetName: string) {
  if (specs.length === 0) return buffer
  const zip = await JSZip.loadAsync(buffer)
  const drawingNumber = 1
  const drawingPath = `xl/drawings/drawing${drawingNumber}.xml`
  const drawingRelsPath = `xl/drawings/_rels/drawing${drawingNumber}.xml.rels`
  let drawingXml = zip.file(drawingPath) ? await zip.file(drawingPath)!.async("string") : `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"></xdr:wsDr>`
  let relsXml = zip.file(drawingRelsPath) ? await zip.file(drawingRelsPath)!.async("string") : `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`
  let drawingRoot = drawingXml.match(/<xdr:wsDr\b[^>]*>/)?.[0] ?? ""
  if (drawingRoot && !drawingRoot.includes('xmlns:c=')) {
    drawingXml = drawingXml.replace(drawingRoot, drawingRoot.replace(">", ' xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart">'))
    drawingRoot = drawingRoot.replace(">", ' xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart">')
  }
  if (drawingRoot && !drawingRoot.includes('xmlns:r=')) drawingXml = drawingXml.replace(drawingRoot, drawingRoot.replace(">", ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'))
  const relationshipIds = [...relsXml.matchAll(/Id="rId(\d+)"/g)].map((match) => Number(match[1]))
  const firstRelationshipId = Math.max(0, ...relationshipIds) + 1
  drawingXml = drawingXml.replace("</xdr:wsDr>", `${buildChartAnchorsXml(specs, firstRelationshipId)}</xdr:wsDr>`)
  relsXml = relsXml.replace("</Relationships>", `${specs.map((_, index) => `<Relationship Id="rId${firstRelationshipId + index}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart${index + 1}.xml"/>`).join("")}</Relationships>`)
  zip.file(drawingPath, drawingXml)
  zip.file(drawingRelsPath, relsXml)
  specs.forEach((spec, index) => zip.file(`xl/charts/chart${index + 1}.xml`, buildChartXml(spec, sheetName, index + 1)))
  const sheetPath = `xl/worksheets/sheet${sheetIndex}.xml`
  const sheetRelsPath = `xl/worksheets/_rels/sheet${sheetIndex}.xml.rels`
  let sheetXml = await zip.file(sheetPath)!.async("string")
  let sheetRelsXml = zip.file(sheetRelsPath) ? await zip.file(sheetRelsPath)!.async("string") : `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`
  if (!sheetXml.includes("<drawing ")) {
    const sheetRelationshipIds = [...sheetRelsXml.matchAll(/Id="rId(\d+)"/g)].map((match) => Number(match[1]))
    const drawingRelationshipId = Math.max(0, ...sheetRelationshipIds) + 1
    sheetXml = sheetXml.replace("</worksheet>", `<drawing r:id="rId${drawingRelationshipId}"/></worksheet>`)
    sheetRelsXml = sheetRelsXml.replace("</Relationships>", `<Relationship Id="rId${drawingRelationshipId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing${drawingNumber}.xml"/></Relationships>`)
  }
  zip.file(sheetPath, sheetXml)
  zip.file(sheetRelsPath, sheetRelsXml)
  const contentTypesPath = "[Content_Types].xml"
  let contentTypes = await zip.file(contentTypesPath)!.async("string")
  for (let index = 1; index <= specs.length; index += 1) {
    if (!contentTypes.includes(`/xl/charts/chart${index}.xml`)) contentTypes = contentTypes.replace("</Types>", `<Override PartName="/xl/charts/chart${index}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/></Types>`)
  }
  zip.file(contentTypesPath, contentTypes)
  return zip.generateAsync({ type: "arraybuffer", compression: "DEFLATE" })
}

export async function buildPopReportWorkbook(payload: PopReportPayload) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "Empresas Polar · Control POP"
  workbook.company = "Empresas Polar"
  workbook.created = new Date(payload.generatedAt)
  workbook.modified = new Date(payload.generatedAt)
  workbook.subject = "Reporte operativo POP"
  workbook.title = `Reporte POP · ${payload.kind}`
  const logoPath = path.join(process.cwd(), "public", "empresas-polar-logo.png")

  addSummarySheet(workbook, payload, logoPath)
  addFiltersSheet(workbook, payload)
  addCampaignSheet(workbook, payload)
  addDeliveriesSheet(workbook, payload)
  addInventorySheet(workbook, payload)
  addCoverageSheet(workbook, payload)
  addActivitySheet(workbook, payload)

  const notes = workbook.addWorksheet("Notas")
  setSheetDefaults(notes, COLORS.muted)
  styleTitle(notes, "Notas del reporte", "Convenciones de exportación POP")
  notes.getColumn(1).width = 24
  notes.getColumn(2).width = 100
  notes.getRow(7).values = ["Elemento", "Definición"]
  styleHeader(notes.getRow(7))
  notes.getRow(8).values = ["Fuente", "Datos mostrados en el panel coordinador. Inventario y entregas se cargan desde Supabase cuando están disponibles."]
  notes.getRow(9).values = ["Filtros", "Las celdas amarillas de la hoja Filtros controlan el resumen ejecutivo y las gráficas."]
  notes.getRow(10).values = ["Detalle", "Las hojas Campañas, Detalle entregas, Inventario POP, Cobertura y Actividad tienen filtros nativos de Excel."]
  notes.getRow(11).values = ["Tipografía", "Aptos, aplicada de forma consistente a celdas y gráficas para un estilo corporativo moderno."]
  notes.getRow(12).values = ["Corte", new Date(payload.generatedAt)]
  notes.getCell("B12").numFmt = "yyyy-mm-dd hh:mm"
  styleBody(notes, 8, 12, 2)
  addTable(notes, "NotasReporteTable", 7, 12, 2)

  const buffer = await workbook.xlsx.writeBuffer()
  const summaryCharts = (workbook.getWorksheet("Resumen ejecutivo") as ExcelJS.Worksheet & { __polarCharts?: ChartSpec[] }).__polarCharts ?? []
  return addNativeCharts(buffer, summaryCharts, 1, "Resumen ejecutivo")
}
