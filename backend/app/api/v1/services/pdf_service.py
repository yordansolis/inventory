# from fastapi import APIRouter, Response, Body
# from fpdf import FPDF
# from datetime import datetime
# from typing import List, Dict, Any, Optional
# from pydantic import BaseModel, Field
# import locale


from fastapi import APIRouter, Response, Body
from fastapi.responses import StreamingResponse
from fpdf import FPDF
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import locale
import io

# Set locale for currency formatting
try:
    locale.setlocale(locale.LC_ALL, 'es_CO.UTF-8')
except locale.Error:
    try:
        locale.setlocale(locale.LC_ALL, 'C.UTF-8')
    except locale.Error:
        print("Warning: Locales for currency formatting not available.")

router = APIRouter()

# --- Helper Functions ---
def format_price(price: float) -> str:
    try:
        # Format as currency without decimals
        return locale.currency(price, symbol=True, grouping=True, international=False).split(',')[0]
    except (ValueError, TypeError):
        return f"${price:,.0f}"

# --- Pydantic Models for Request Body ---

class MetodoPago(BaseModel):
    payment_method: str
    count: int
    total: float

class ProductoTop(BaseModel):
    producto: str
    variante: Optional[str] = None
    cantidad_vendida: int = Field(alias="quantity_sold")
    numero_ordenes: int
    ingresos: float = Field(alias="revenue")

    class Config:
        allow_population_by_field_name = True

class ReportData(BaseModel):
    total_ventas: float
    cantidad_ventas: int
    ticket_promedio: float
    cantidad_domicilios: int
    metodos_pago: List[MetodoPago]
    productos_top: List[ProductoTop]

class ExtractDataItem(BaseModel):
    invoice_number: str
    invoice_date: str
    invoice_time: str
    cliente: str
    vendedor: str
    product_name: str
    product_variant: Optional[str] = None
    quantity: int
    unit_price: float
    subtotal: float
    total_amount: float
    payment_method: str

class PDFRequest(BaseModel):
    report_data: ReportData
    extract_data: List[ExtractDataItem]
    period: str

# --- PDF Generation Logic ---

class PDF(FPDF):
    def __init__(self, period: str):
        super().__init__()
        self.period = period
        self.alias_nb_pages()

    def header(self):
        self.set_font('Arial', 'B', 16)
        self.cell(0, 10, 'Reporte de Ventas', 0, 1, 'C')
        self.set_font('Arial', 'I', 10)
        self.cell(0, 8, self.period, 0, 1, 'C')
        self.set_font('Arial', '', 8)
        self.cell(0, 6, f'Generado el: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}', 0, 1, 'C')
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Página {self.page_no()}/{{nb}}', 0, 0, 'C')

    def chapter_title(self, title: str):
        self.set_font('Arial', 'B', 12)
        self.cell(0, 10, title, 0, 1, 'L')
        self.ln(2)
        
    def summary_card(self, title: str, value: str):
        self.set_font('Arial', '', 10)
        self.cell(40, 8, title, 'B', 0)
        self.set_font('Arial', 'B', 10)
        self.cell(0, 8, value, 'B', 1)

    def table_header(self, headers: list, col_widths: list):
        self.set_font('Arial', 'B', 8)
        self.set_fill_color(240, 240, 240)
        for i, header in enumerate(headers):
            self.cell(col_widths[i], 7, header, 1, 0, 'C', 1)
        self.ln()

    def table_row(self, data: list, col_widths: list, align: list = None):
        if align is None:
            align = ['L'] * len(data)
        self.set_font('Arial', '', 8)
        
        # Check if we need a page break
        if self.get_y() + 10 > self.page_break_trigger:
            self.add_page()
            
        for i, datum in enumerate(data):
            self.cell(col_widths[i], 6, str(datum), 'LR', 0, align[i])
        self.ln()
        
    def draw_table_border(self):
        self.cell(sum(self.current_col_widths), 0, '', 'T', 1)

def generate_pdf_report(report_data: dict, extract_data: list, period: str):
    pdf = PDF(period=period)
    pdf.add_page()

    # --- Summary Section ---
    pdf.chapter_title("Resumen General")
    summary_data = {
        "Total Ventas:": format_price(report_data['total_ventas']),
        "Cantidad de Ventas:": str(report_data['cantidad_ventas']),
        "Ticket Promedio:": format_price(report_data['ticket_promedio']),
        "Total Domicilios:": str(report_data['cantidad_domicilios']),
    }
    for title, value in summary_data.items():
        pdf.summary_card(title, value)
    pdf.ln(10)

    # --- Split layout for tables ---
    page_width = pdf.w - 2 * pdf.l_margin
    left_col_width = page_width * 0.6
    right_col_width = page_width * 0.38
    
    y_before_tables = pdf.get_y()

    # --- Top Products Table (Left Column) ---
    pdf.set_x(pdf.l_margin)
    pdf.chapter_title("Productos Más Vendidos")
    
    headers = ["Producto", "Cant.", "Órdenes", "Ingresos"]
    col_widths = [left_col_width * 0.5, 20, 25, 35]
    pdf.current_col_widths = col_widths
    pdf.table_header(headers, col_widths)

    align = ['L', 'R', 'R', 'R']
    for p in report_data['productos_top']:
        data = [
            f"{p['producto']} ({p['variante']})" if p['variante'] else p['producto'],
            str(p['cantidad_vendida']),
            str(p['numero_ordenes']),
            format_price(p['ingresos'])
        ]
        pdf.table_row(data, col_widths, align)
    pdf.draw_table_border()
    
    y_after_left_table = pdf.get_y()
    pdf.set_y(y_before_tables) # Reset Y to start right column
    
    # --- Payment Methods Table (Right Column) ---
    pdf.set_x(pdf.l_margin + left_col_width + page_width * 0.02)
    pdf.chapter_title("Métodos de Pago")
    
    headers = ["Método", "#", "Total"]
    col_widths = [right_col_width * 0.5, 15, 30]
    pdf.current_col_widths = col_widths
    pdf.table_header(headers, col_widths)

    align = ['L', 'R', 'R']
    for m in report_data['metodos_pago']:
        data = [m['payment_method'], str(m['count']), format_price(m['total'])]
        pdf.table_row(data, col_widths, align)
    pdf.draw_table_border()

    y_after_right_table = pdf.get_y()
    
    # Set Y to the bottom of the longest table
    pdf.set_y(max(y_after_left_table, y_after_right_table))
    pdf.ln(10)

    # --- Detailed Extract Table ---
    pdf.chapter_title("Extracto Detallado")
    
    headers = ["Factura", "Fecha", "Cliente", "Producto", "Cant.", "Subtotal", "Total", "Pago"]
    col_widths = [25, 20, 30, 40, 10, 20, 25, 20]
    pdf.current_col_widths = col_widths
    pdf.table_header(headers, col_widths)
    
    align = ['L', 'L', 'L', 'L', 'R', 'R', 'R', 'L']
    if extract_data:
        for item in extract_data:
            data = [
                item['invoice_number'],
                item['invoice_date'],
                item['cliente'],
                item['product_name'],
                str(item['quantity']),
                format_price(item['subtotal']),
                format_price(item['total_amount']),
                item['payment_method']
            ]
            pdf.table_row(data, col_widths, align)
        pdf.draw_table_border()
    else:
        pdf.cell(sum(col_widths), 10, "No hay datos para mostrar", 1, 1, 'C')

    # Asegurar que siempre retornemos bytes
    raw = pdf.output(dest='S')
    
    # Convertir a bytes según el tipo retornado
    if isinstance(raw, str):
        return raw.encode('latin-1')
    elif isinstance(raw, bytearray):
        return bytes(raw)
    elif isinstance(raw, bytes):
        return raw
    else:
        # Si es algún otro tipo, intentar convertir a string y luego a bytes
        return str(raw).encode('latin-1')


# --- API Endpoint ---

@router.post("/pdf/generate-report", tags=["PDF Generation"])
async def api_generate_pdf_report(request: PDFRequest = Body(...)):
    """
    Generates a PDF report from structured report and extract data.
    """
    pdf_content = generate_pdf_report(
        request.report_data.dict(),
        [item.dict() for item in request.extract_data],
        request.period
    )
    
    filename = f"reporte_ventas_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    
    # Usar BytesIO para crear un stream
    pdf_stream = io.BytesIO(pdf_content)
    
    return StreamingResponse(
        io.BytesIO(pdf_content),
        media_type='application/pdf',
        headers={'Content-Disposition': f'attachment; filename="{filename}"'}
    )

# # Set locale for currency formatting
# try:
#     locale.setlocale(locale.LC_ALL, 'es_CO.UTF-8')
# except locale.Error:
#     try:
#         locale.setlocale(locale.LC_ALL, 'C.UTF-8')
#     except locale.Error:
#         print("Warning: Locales for currency formatting not available.")

# router = APIRouter()

# # --- Helper Functions ---
# def format_price(price: float) -> str:
#     try:
#         # Format as currency without decimals
#         return locale.currency(price, symbol=True, grouping=True, international=False).split(',')[0]
#     except (ValueError, TypeError):
#         return f"${price:,.0f}"

# # --- Pydantic Models for Request Body ---

# class MetodoPago(BaseModel):
#     payment_method: str
#     count: int
#     total: float

# class ProductoTop(BaseModel):
#     producto: str
#     variante: Optional[str] = None
#     cantidad_vendida: int = Field(alias="quantity_sold")
#     numero_ordenes: int
#     ingresos: float = Field(alias="revenue")

#     class Config:
#         allow_population_by_field_name = True

# class ReportData(BaseModel):
#     total_ventas: float
#     cantidad_ventas: int
#     ticket_promedio: float
#     cantidad_domicilios: int
#     metodos_pago: List[MetodoPago]
#     productos_top: List[ProductoTop]

# class ExtractDataItem(BaseModel):
#     invoice_number: str
#     invoice_date: str
#     invoice_time: str
#     cliente: str
#     vendedor: str
#     product_name: str
#     product_variant: Optional[str] = None
#     quantity: int
#     unit_price: float
#     subtotal: float
#     total_amount: float
#     payment_method: str

# class PDFRequest(BaseModel):
#     report_data: ReportData
#     extract_data: List[ExtractDataItem]
#     period: str

# # --- PDF Generation Logic ---

# class PDF(FPDF):
#     def __init__(self, period: str):
#         super().__init__()
#         self.period = period
#         self.alias_nb_pages()

#     def header(self):
#         self.set_font('Arial', 'B', 16)
#         self.cell(0, 10, 'Reporte de Ventas', 0, 1, 'C')
#         self.set_font('Arial', 'I', 10)
#         self.cell(0, 8, self.period, 0, 1, 'C')
#         self.set_font('Arial', '', 8)
#         self.cell(0, 6, f'Generado el: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}', 0, 1, 'C')
#         self.ln(10)

#     def footer(self):
#         self.set_y(-15)
#         self.set_font('Arial', 'I', 8)
#         self.cell(0, 10, f'Página {self.page_no()}/{{nb}}', 0, 0, 'C')

#     def chapter_title(self, title: str):
#         self.set_font('Arial', 'B', 12)
#         self.cell(0, 10, title, 0, 1, 'L')
#         self.ln(2)
        
#     def summary_card(self, title: str, value: str):
#         self.set_font('Arial', '', 10)
#         self.cell(40, 8, title, 'B', 0)
#         self.set_font('Arial', 'B', 10)
#         self.cell(0, 8, value, 'B', 1)

#     def table_header(self, headers: list, col_widths: list):
#         self.set_font('Arial', 'B', 8)
#         self.set_fill_color(240, 240, 240)
#         for i, header in enumerate(headers):
#             self.cell(col_widths[i], 7, header, 1, 0, 'C', 1)
#         self.ln()

#     def table_row(self, data: list, col_widths: list, align: list = None):
#         if align is None:
#             align = ['L'] * len(data)
#         self.set_font('Arial', '', 8)
        
#         # Check if we need a page break
#         if self.get_y() + 10 > self.page_break_trigger:
#             self.add_page()
            
#         for i, datum in enumerate(data):
#             self.cell(col_widths[i], 6, str(datum), 'LR', 0, align[i])
#         self.ln()
        
#     def draw_table_border(self):
#         self.cell(sum(self.current_col_widths), 0, '', 'T', 1)

# def generate_pdf_report(report_data: dict, extract_data: list, period: str):
#     pdf = PDF(period=period)
#     pdf.add_page()

#     # --- Summary Section ---
#     pdf.chapter_title("Resumen General")
#     summary_data = {
#         "Total Ventas:": format_price(report_data['total_ventas']),
#         "Cantidad de Ventas:": str(report_data['cantidad_ventas']),
#         "Ticket Promedio:": format_price(report_data['ticket_promedio']),
#         "Total Domicilios:": str(report_data['cantidad_domicilios']),
#     }
#     for title, value in summary_data.items():
#         pdf.summary_card(title, value)
#     pdf.ln(10)

#     # --- Split layout for tables ---
#     page_width = pdf.w - 2 * pdf.l_margin
#     left_col_width = page_width * 0.6
#     right_col_width = page_width * 0.38
    
#     y_before_tables = pdf.get_y()

#     # --- Top Products Table (Left Column) ---
#     pdf.set_x(pdf.l_margin)
#     pdf.chapter_title("Productos Más Vendidos")
    
#     headers = ["Producto", "Cant.", "Órdenes", "Ingresos"]
#     col_widths = [left_col_width * 0.5, 20, 25, 35]
#     pdf.current_col_widths = col_widths
#     pdf.table_header(headers, col_widths)

#     align = ['L', 'R', 'R', 'R']
#     for p in report_data['productos_top']:
#         data = [
#             f"{p['producto']} ({p['variante']})" if p['variante'] else p['producto'],
#             str(p['cantidad_vendida']),
#             str(p['numero_ordenes']),
#             format_price(p['ingresos'])
#         ]
#         pdf.table_row(data, col_widths, align)
#     pdf.draw_table_border()
    
#     y_after_left_table = pdf.get_y()
#     pdf.set_y(y_before_tables) # Reset Y to start right column
    
#     # --- Payment Methods Table (Right Column) ---
#     pdf.set_x(pdf.l_margin + left_col_width + page_width * 0.02)
#     pdf.chapter_title("Métodos de Pago")
    
#     headers = ["Método", "#", "Total"]
#     col_widths = [right_col_width * 0.5, 15, 30]
#     pdf.current_col_widths = col_widths
#     pdf.table_header(headers, col_widths)

#     align = ['L', 'R', 'R']
#     for m in report_data['metodos_pago']:
#         data = [m['payment_method'], str(m['count']), format_price(m['total'])]
#         pdf.table_row(data, col_widths, align)
#     pdf.draw_table_border()

#     y_after_right_table = pdf.get_y()
    
#     # Set Y to the bottom of the longest table
#     pdf.set_y(max(y_after_left_table, y_after_right_table))
#     pdf.ln(10)

#     # --- Detailed Extract Table ---
#     pdf.chapter_title("Extracto Detallado")
    
#     headers = ["Factura", "Fecha", "Cliente", "Producto", "Cant.", "Subtotal", "Total", "Pago"]
#     col_widths = [25, 20, 30, 40, 10, 20, 25, 20]
#     pdf.current_col_widths = col_widths
#     pdf.table_header(headers, col_widths)
    
#     align = ['L', 'L', 'L', 'L', 'R', 'R', 'R', 'L']
#     if extract_data:
#         for item in extract_data:
#             data = [
#                 item['invoice_number'],
#                 item['invoice_date'],
#                 item['cliente'],
#                 item['product_name'],
#                 str(item['quantity']),
#                 format_price(item['subtotal']),
#                 format_price(item['total_amount']),
#                 item['payment_method']
#             ]
#             pdf.table_row(data, col_widths, align)
#         pdf.draw_table_border()
#     else:
#         pdf.cell(sum(col_widths), 10, "No hay datos para mostrar", 1, 1, 'C')

#     raw = pdf.output(dest='S')
#     # fpdf2 may return either bytes or str depending on version
#     if isinstance(raw, str):
#         raw = raw.encode('latin-1')
#     return raw


# # --- API Endpoint ---

# @router.post("/pdf/generate-report", tags=["PDF Generation"])
# async def api_generate_pdf_report(request: PDFRequest = Body(...)):
#     """
#     Generates a PDF report from structured report and extract data.
#     """
#     pdf_content = generate_pdf_report(
#         request.report_data.dict(),
#         [item.dict() for item in request.extract_data],
#         request.period
#     )
    
#     filename = f"reporte_ventas_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    
#     return Response(
#         content=pdf_content, 
#         media_type='application/pdf', 
#         headers={'Content-Disposition': f'attachment; filename="{filename}"'}
#     ) 