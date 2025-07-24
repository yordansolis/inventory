from fastapi import APIRouter, Response, Body
from fastapi.responses import StreamingResponse
from fpdf import FPDF
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
import locale
import io

from pathlib import Path

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
def get_logo_path() -> Optional[str]:
    """
    Busca el logo en el directorio @/icons
    Soporta formatos: png, jpg, jpeg, gif
    """
    # ============ AQUÍ ESTÁ LA RUTA ============
    # Obtener el directorio base del proyecto
    current_dir = Path(__file__).resolve().parent
    
    # Navegar hasta encontrar el directorio icons
    # Asumiendo que @/icons está en la raíz del proyecto
    project_root = current_dir
    while project_root.parent != project_root:
        icons_dir = project_root / "icons"  # ← RUTA PRINCIPAL: busca carpeta "icons"
        if icons_dir.exists():
            break
        project_root = project_root.parent
    else:
        # Si no encontramos, intentar desde la raíz actual
        icons_dir = Path.cwd() / "icons"  # ← RUTA ALTERNATIVA: desde directorio actual
    
    if not icons_dir.exists():
        print(f"Warning: Directorio icons no encontrado en {icons_dir}")
        return None
    
    # ============ NOMBRES DE ARCHIVO QUE BUSCA ============
    # Buscar archivos de logo comunes
    logo_names = ["logo.png", "logo.jpg", "logo.jpeg", "logo.gif", "brand.png", "company.png"]  # ← NOMBRES ESPECÍFICOS
    
    for logo_name in logo_names:
        logo_path = icons_dir / logo_name
        if logo_path.exists():
            print(f"Logo encontrado en: {logo_path}")  # ← MENSAJE DE DEBUG
            return str(logo_path)
    
    # Si no encuentra nombres comunes, tomar el primer archivo de imagen
    for ext in ["*.png", "*.jpg", "*.jpeg", "*.gif"]:  # ← EXTENSIONES SOPORTADAS
        logo_files = list(icons_dir.glob(ext))
        if logo_files:
            print(f"Logo encontrado (primer archivo): {logo_files[0]}")  # ← MENSAJE DE DEBUG
            return str(logo_files[0])
    
    print(f"Warning: No se encontró logo en {icons_dir}")
    return None

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
    use_logo: bool = True  # Cambiar a booleano para usar logo automáticamente

# --- PDF Generation Logic ---

class PDF(FPDF):
    def __init__(self, period: str, logo_path: Optional[str] = None):
        super().__init__()
        self.period = period
        self.logo_path = logo_path
        self.alias_nb_pages()

    def header(self):
        # Logo si está disponible
        if self.logo_path:
            try:
                # Verificar si el archivo existe y agregarlo
                self.image(self.logo_path, 10, 8, 33)  # x, y, width
                self.ln(20)  # Espacio después del logo
            except:
                # Si hay error con el logo, continuar sin él
                pass
        
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
        if self.get_y() + 15 > self.page_break_trigger:
            self.add_page()
            
        # Calcular la altura necesaria para textos largos
        max_lines = 1
        processed_data = []
        
        for i, datum in enumerate(data):
            text = str(datum)
            # Calcular cuántas líneas necesita el texto
            text_width = col_widths[i] - 2  # Margen interno
            if self.get_string_width(text) > text_width:
                # Dividir texto en líneas
                lines = self._split_text(text, text_width)
                max_lines = max(max_lines, len(lines))
                processed_data.append(lines)
            else:
                processed_data.append([text])
        
        # Calcular altura de la fila
        row_height = max_lines * 4 + 2
        
        # Dibujar cada línea
        for line_num in range(max_lines):
            for i, lines in enumerate(processed_data):
                text = lines[line_num] if line_num < len(lines) else ""
                self.cell(col_widths[i], 4 if max_lines > 1 else 6, text, 'LR', 0, align[i])
            self.ln(4 if max_lines > 1 else 6)
    
    def _split_text(self, text: str, max_width: float) -> list:
        """Divide el texto en líneas que caben en el ancho especificado"""
        words = text.split(' ')
        lines = []
        current_line = ""
        
        for word in words:
            test_line = f"{current_line} {word}".strip()
            if self.get_string_width(test_line) <= max_width:
                current_line = test_line
            else:
                if current_line:
                    lines.append(current_line)
                current_line = word
                # Si una palabra sola es muy larga, cortarla
                while self.get_string_width(current_line) > max_width and len(current_line) > 1:
                    # Encontrar punto de corte
                    cut_pos = len(current_line)
                    while cut_pos > 0 and self.get_string_width(current_line[:cut_pos]) > max_width:
                        cut_pos -= 1
                    if cut_pos > 0:
                        lines.append(current_line[:cut_pos])
                        current_line = current_line[cut_pos:]
                    else:
                        break
        
        if current_line:
            lines.append(current_line)
            
        return lines if lines else [""]
        
    def draw_table_border(self):
        self.cell(sum(self.current_col_widths), 0, '', 'T', 1)

def generate_pdf_report(report_data: dict, extract_data: list, period: str, use_logo: bool = True):
    # Obtener el logo automáticamente si se solicita
    logo_path = get_logo_path() if use_logo else None
    pdf = PDF(period=period, logo_path=logo_path)
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
    col_widths = [left_col_width * 0.55, 18, 22, 32]  # Ajustado para dar más espacio al producto
    pdf.current_col_widths = col_widths
    pdf.table_header(headers, col_widths)

    align = ['L', 'R', 'R', 'R']
    for p in report_data['productos_top']:
        # Formatear nombre del producto de manera más compacta
        producto_nombre = p['producto']
        if p['variante'] and p['variante'].strip():
            # Truncar variante si es muy larga
            variante = p['variante'][:20] + "..." if len(p['variante']) > 20 else p['variante']
            producto_texto = f"{producto_nombre}\n({variante})"
        else:
            producto_texto = producto_nombre
            
        data = [
            producto_texto,
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
    Automatically includes logo from @/icons directory if use_logo=True.
    """
    pdf_content = generate_pdf_report(
        request.report_data.dict(),
        [item.dict() for item in request.extract_data],
        request.period,
        request.use_logo
    )
    
    filename = f"reporte_ventas_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    
    # Usar BytesIO para crear un stream
    pdf_stream = io.BytesIO(pdf_content)
    
    return StreamingResponse(
        io.BytesIO(pdf_content),
        media_type='application/pdf',
        headers={'Content-Disposition': f'attachment; filename="{filename}"'}
    )



# from fastapi import APIRouter, Response, Body
# from fastapi.responses import StreamingResponse
# from fpdf import FPDF
# from datetime import datetime
# from typing import List, Dict, Any, Optional
# from pydantic import BaseModel, Field
# import locale
# import io

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
#     logo_path: Optional[str] = None

# # --- PDF Generation Logic ---

# class PDF(FPDF):
#     def __init__(self, period: str, logo_path: Optional[str] = None):
#         super().__init__()
#         self.period = period
#         self.logo_path = logo_path
#         self.alias_nb_pages()

#     def header(self):
#         # Logo si está disponible
#         if self.logo_path:
#             try:
#                 # Verificar si el archivo existe y agregarlo
#                 self.image(self.logo_path, 10, 8, 33)  # x, y, width
#                 self.ln(20)  # Espacio después del logo
#             except:
#                 # Si hay error con el logo, continuar sin él
#                 pass
        
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
#         if self.get_y() + 15 > self.page_break_trigger:
#             self.add_page()
            
#         # Calcular la altura necesaria para textos largos
#         max_lines = 1
#         processed_data = []
        
#         for i, datum in enumerate(data):
#             text = str(datum)
#             # Calcular cuántas líneas necesita el texto
#             text_width = col_widths[i] - 2  # Margen interno
#             if self.get_string_width(text) > text_width:
#                 # Dividir texto en líneas
#                 lines = self._split_text(text, text_width)
#                 max_lines = max(max_lines, len(lines))
#                 processed_data.append(lines)
#             else:
#                 processed_data.append([text])
        
#         # Calcular altura de la fila
#         row_height = max_lines * 4 + 2
        
#         # Dibujar cada línea
#         for line_num in range(max_lines):
#             for i, lines in enumerate(processed_data):
#                 text = lines[line_num] if line_num < len(lines) else ""
#                 self.cell(col_widths[i], 4 if max_lines > 1 else 6, text, 'LR', 0, align[i])
#             self.ln(4 if max_lines > 1 else 6)
    
#     def _split_text(self, text: str, max_width: float) -> list:
#         """Divide el texto en líneas que caben en el ancho especificado"""
#         words = text.split(' ')
#         lines = []
#         current_line = ""
        
#         for word in words:
#             test_line = f"{current_line} {word}".strip()
#             if self.get_string_width(test_line) <= max_width:
#                 current_line = test_line
#             else:
#                 if current_line:
#                     lines.append(current_line)
#                 current_line = word
#                 # Si una palabra sola es muy larga, cortarla
#                 while self.get_string_width(current_line) > max_width and len(current_line) > 1:
#                     # Encontrar punto de corte
#                     cut_pos = len(current_line)
#                     while cut_pos > 0 and self.get_string_width(current_line[:cut_pos]) > max_width:
#                         cut_pos -= 1
#                     if cut_pos > 0:
#                         lines.append(current_line[:cut_pos])
#                         current_line = current_line[cut_pos:]
#                     else:
#                         break
        
#         if current_line:
#             lines.append(current_line)
            
#         return lines if lines else [""]
        
#     def draw_table_border(self):
#         self.cell(sum(self.current_col_widths), 0, '', 'T', 1)

# def generate_pdf_report(report_data: dict, extract_data: list, period: str, logo_path: Optional[str] = None):
#     pdf = PDF(period=period, logo_path=logo_path)
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
#     col_widths = [left_col_width * 0.55, 18, 22, 32]  # Ajustado para dar más espacio al producto
#     pdf.current_col_widths = col_widths
#     pdf.table_header(headers, col_widths)

#     align = ['L', 'R', 'R', 'R']
#     for p in report_data['productos_top']:
#         # Formatear nombre del producto de manera más compacta
#         producto_nombre = p['producto']
#         if p['variante'] and p['variante'].strip():
#             # Truncar variante si es muy larga
#             variante = p['variante'][:20] + "..." if len(p['variante']) > 20 else p['variante']
#             producto_texto = f"{producto_nombre}\n({variante})"
#         else:
#             producto_texto = producto_nombre
            
#         data = [
#             producto_texto,
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

#     # Asegurar que siempre retornemos bytes
#     raw = pdf.output(dest='S')
    
#     # Convertir a bytes según el tipo retornado
#     if isinstance(raw, str):
#         return raw.encode('latin-1')
#     elif isinstance(raw, bytearray):
#         return bytes(raw)
#     elif isinstance(raw, bytes):
#         return raw
#     else:
#         # Si es algún otro tipo, intentar convertir a string y luego a bytes
#         return str(raw).encode('latin-1')


# # --- API Endpoint ---

# @router.post("/pdf/generate-report", tags=["PDF Generation"])
# async def api_generate_pdf_report(request: PDFRequest = Body(...)):
#     """
#     Generates a PDF report from structured report and extract data.
#     Optional logo_path parameter to include business logo in header.
#     """
#     pdf_content = generate_pdf_report(
#         request.report_data.dict(),
#         [item.dict() for item in request.extract_data],
#         request.period,
#         request.logo_path
#     )
    
#     filename = f"reporte_ventas_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    
#     # Usar BytesIO para crear un stream
#     pdf_stream = io.BytesIO(pdf_content)
    
#     return StreamingResponse(
#         io.BytesIO(pdf_content),
#         media_type='application/pdf',
#         headers={'Content-Disposition': f'attachment; filename="{filename}"'}
#     )

