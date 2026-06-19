from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.pdfgen import canvas
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate
import datetime

# ── Colors ─────────────────────────────────────────────────────────────────
VIOLET      = HexColor('#7c3aed')
DARK_VIOLET = HexColor('#0f0c29')
INDIGO      = HexColor('#4f46e5')
EMERALD     = HexColor('#059669')
AMBER       = HexColor('#d97706')
PINK        = HexColor('#db2777')
GRAY_900    = HexColor('#111827')
GRAY_700    = HexColor('#374151')
GRAY_500    = HexColor('#6b7280')
GRAY_200    = HexColor('#e5e7eb')
GRAY_50     = HexColor('#f9fafb')
LIGHT_VIOLET= HexColor('#ede9fe')
LIGHT_BLUE  = HexColor('#eff6ff')

W, H = A4

# ── Page numbering canvas ───────────────────────────────────────────────────
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self._draw_page_footer(total)
            super().showPage()
        super().save()

    def _draw_page_footer(self, total):
        page_num = self._saved_page_states.index(dict(
            {k: v for k, v in self.__dict__.items()}
        )) if dict({k: v for k, v in self.__dict__.items()}) in self._saved_page_states else 0
        # Simple footer
        self.setFillColor(GRAY_500)
        self.setFont('Helvetica', 8)
        self.drawCentredString(W/2, 12*mm, f'Textile Management System — User Manual   |   Page {self._pageNumber} of {total}')
        self.setStrokeColor(GRAY_200)
        self.setLineWidth(0.5)
        self.line(20*mm, 17*mm, W - 20*mm, 17*mm)

# ── Styles ──────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

def S(name, **kw):
    return ParagraphStyle(name, **kw)

style_h1 = S('H1', fontName='Helvetica-Bold', fontSize=22, textColor=white,
              spaceAfter=4, spaceBefore=0, leading=28)
style_h2 = S('H2', fontName='Helvetica-Bold', fontSize=15, textColor=VIOLET,
              spaceAfter=6, spaceBefore=16, leading=20)
style_h3 = S('H3', fontName='Helvetica-Bold', fontSize=12, textColor=GRAY_900,
              spaceAfter=4, spaceBefore=10, leading=16)
style_h4 = S('H4', fontName='Helvetica-Bold', fontSize=10, textColor=INDIGO,
              spaceAfter=3, spaceBefore=8, leading=14)
style_body = S('Body', fontName='Helvetica', fontSize=10, textColor=GRAY_700,
               spaceAfter=5, spaceBefore=2, leading=15, alignment=TA_JUSTIFY)
style_small = S('Small', fontName='Helvetica', fontSize=9, textColor=GRAY_500,
                spaceAfter=3, spaceBefore=1, leading=13)
style_bold = S('Bold', fontName='Helvetica-Bold', fontSize=10, textColor=GRAY_900,
               spaceAfter=3, leading=14)
style_note = S('Note', fontName='Helvetica-Oblique', fontSize=9, textColor=AMBER,
               spaceAfter=4, spaceBefore=4, leading=13)
style_tip = S('Tip', fontName='Helvetica', fontSize=9, textColor=EMERALD,
              spaceAfter=4, spaceBefore=4, leading=13)
style_center = S('Center', fontName='Helvetica', fontSize=10, textColor=GRAY_700,
                 alignment=TA_CENTER, spaceAfter=4, leading=14)
style_toc = S('TOC', fontName='Helvetica', fontSize=10, textColor=GRAY_700,
              spaceAfter=3, leftIndent=0, leading=16)
style_toc_sub = S('TOCSub', fontName='Helvetica', fontSize=9, textColor=GRAY_500,
                  spaceAfter=2, leftIndent=15, leading=14)

# ── Helpers ─────────────────────────────────────────────────────────────────
def hr(color=GRAY_200, thickness=0.5):
    return HRFlowable(width='100%', thickness=thickness, color=color, spaceAfter=8, spaceBefore=4)

def sp(h=6):
    return Spacer(1, h)

def p(text, style=None):
    return Paragraph(text, style or style_body)

def h2(text):
    return Paragraph(text, style_h2)

def h3(text):
    return Paragraph(text, style_h3)

def h4(text):
    return Paragraph(text, style_h4)

def note(text):
    return Paragraph(f'<b>Note:</b> {text}', style_note)

def tip(text):
    return Paragraph(f'<b>Tip:</b> {text}', style_tip)

def info_box(title, items, color=LIGHT_VIOLET, border=VIOLET):
    data = [[Paragraph(f'<b>{title}</b>', S('IB', fontName='Helvetica-Bold', fontSize=10, textColor=border, leading=14))]]
    for item in items:
        data.append([Paragraph(f'• {item}', S('IBI', fontName='Helvetica', fontSize=9, textColor=GRAY_700, leading=13, leftIndent=8))])
    t = Table(data, colWidths=[W - 50*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), color),
        ('BOX', (0,0), (-1,-1), 1, border),
        ('ROUNDEDCORNERS', [6]),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    return t

def step_table(steps):
    """Numbered step list."""
    data = []
    for i, (title, desc) in enumerate(steps, 1):
        num_p = Paragraph(f'<b>{i}</b>', S('N', fontName='Helvetica-Bold', fontSize=11,
                          textColor=white, alignment=TA_CENTER, leading=14))
        content = [Paragraph(f'<b>{title}</b>', S('ST', fontName='Helvetica-Bold', fontSize=10, textColor=GRAY_900, leading=14))]
        if desc:
            content.append(Paragraph(desc, S('SD', fontName='Helvetica', fontSize=9, textColor=GRAY_700, leading=13)))
        data.append([num_p, content])

    col_w = [W - 50*mm]
    t = Table(data, colWidths=[10*mm, W - 65*mm])
    style_list = [
        ('BACKGROUND', (0,0), (0,-1), VIOLET),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (0,-1), 0),
        ('RIGHTPADDING', (0,0), (0,-1), 0),
        ('LEFTPADDING', (1,0), (1,-1), 10),
        ('LINEBELOW', (0,0), (-1,-2), 0.5, GRAY_200),
    ]
    t.setStyle(TableStyle(style_list))
    return t

def two_col_table(rows, header=None):
    data = []
    if header:
        data.append([Paragraph(f'<b>{header[0]}</b>', S('TH', fontName='Helvetica-Bold', fontSize=9, textColor=white, leading=13)),
                     Paragraph(f'<b>{header[1]}</b>', S('TH2', fontName='Helvetica-Bold', fontSize=9, textColor=white, leading=13))])
    for a, b in rows:
        data.append([
            Paragraph(str(a), S('TC1', fontName='Helvetica-Bold', fontSize=9, textColor=GRAY_900, leading=13)),
            Paragraph(str(b), S('TC2', fontName='Helvetica', fontSize=9, textColor=GRAY_700, leading=13)),
        ])
    col1 = 55*mm
    col2 = W - 50*mm - col1
    t = Table(data, colWidths=[col1, col2])
    ts = [
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('LINEBELOW', (0,0), (-1,-2), 0.5, GRAY_200),
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [white, GRAY_50]),
        ('BOX', (0,0), (-1,-1), 0.5, GRAY_200),
    ]
    if header:
        ts += [
            ('BACKGROUND', (0,0), (-1,0), VIOLET),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [white, GRAY_50]),
        ]
    t.setStyle(TableStyle(ts))
    return t

def section_header_box(number, title, subtitle=''):
    data = [[
        Paragraph(f'<b>{number}</b>', S('SN', fontName='Helvetica-Bold', fontSize=20, textColor=white, alignment=TA_CENTER, leading=24)),
        [Paragraph(f'<b>{title}</b>', S('ST2', fontName='Helvetica-Bold', fontSize=16, textColor=white, leading=20)),
         Paragraph(subtitle, S('SS', fontName='Helvetica', fontSize=10, textColor=HexColor('#c4b5fd'), leading=14))] if subtitle else
        [Paragraph(f'<b>{title}</b>', S('ST3', fontName='Helvetica-Bold', fontSize=16, textColor=white, leading=20))]
    ]]
    t = Table(data, colWidths=[18*mm, W - 68*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), DARK_VIOLET),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 12),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
        ('LEFTPADDING', (0,0), (0,-1), 14),
        ('LEFTPADDING', (1,0), (1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 14),
    ]))
    return t

# ── Build document ───────────────────────────────────────────────────────────
output_path = '/mnt/user-data/outputs/Textile_MS_User_Manual.pdf'
doc = SimpleDocTemplate(output_path, pagesize=A4,
                        topMargin=20*mm, bottomMargin=22*mm,
                        leftMargin=25*mm, rightMargin=25*mm,
                        title='Textile Management System — User Manual',
                        author='Textile Management System')

story = []

# ════════════════════════════════════════════════════════
# COVER PAGE
# ════════════════════════════════════════════════════════
def cover_page(canvas_obj, doc):
    canvas_obj.saveState()
    # Background
    canvas_obj.setFillColor(DARK_VIOLET)
    canvas_obj.rect(0, 0, W, H, fill=1, stroke=0)
    # Top accent bar
    canvas_obj.setFillColor(VIOLET)
    canvas_obj.rect(0, H - 8*mm, W, 8*mm, fill=1, stroke=0)
    # Bottom accent
    canvas_obj.setFillColor(INDIGO)
    canvas_obj.rect(0, 0, W, 6*mm, fill=1, stroke=0)
    # Left stripe
    canvas_obj.setFillColor(HexColor('#1e1b4b'))
    canvas_obj.rect(0, 0, 18*mm, H, fill=1, stroke=0)
    # Logo circle
    canvas_obj.setFillColor(VIOLET)
    canvas_obj.circle(W/2, H*0.68, 28*mm, fill=1, stroke=0)
    canvas_obj.setFillColor(white)
    canvas_obj.setFont('Helvetica-Bold', 28)
    canvas_obj.drawCentredString(W/2, H*0.68 - 10, 'TMS')
    # Title
    canvas_obj.setFillColor(white)
    canvas_obj.setFont('Helvetica-Bold', 32)
    canvas_obj.drawCentredString(W/2, H*0.50, 'Textile Management')
    canvas_obj.setFont('Helvetica-Bold', 32)
    canvas_obj.drawCentredString(W/2, H*0.50 - 38, 'System')
    # Subtitle
    canvas_obj.setFillColor(HexColor('#c4b5fd'))
    canvas_obj.setFont('Helvetica', 14)
    canvas_obj.drawCentredString(W/2, H*0.50 - 70, 'Complete User Manual')
    # Divider
    canvas_obj.setStrokeColor(VIOLET)
    canvas_obj.setLineWidth(1.5)
    canvas_obj.line(W/2 - 40*mm, H*0.50 - 82, W/2 + 40*mm, H*0.50 - 82)
    # Version & date
    canvas_obj.setFillColor(HexColor('#a78bfa'))
    canvas_obj.setFont('Helvetica', 11)
    canvas_obj.drawCentredString(W/2, H*0.50 - 96, f'Version 1.0   |   {datetime.date.today().strftime("%B %Y")}')
    # FBR compliance note
    canvas_obj.setFillColor(HexColor('#6d28d9'))
    canvas_obj.roundRect(W/2 - 55*mm, H*0.18, 110*mm, 22*mm, 4*mm, fill=1, stroke=0)
    canvas_obj.setFillColor(white)
    canvas_obj.setFont('Helvetica-Bold', 10)
    canvas_obj.drawCentredString(W/2, H*0.18 + 13, 'FBR / PRAL e-Invoice Compliant')
    canvas_obj.setFont('Helvetica', 9)
    canvas_obj.drawCentredString(W/2, H*0.18 + 4, 'Sales Tax | NTN Verification | Province-based Tax Routing')
    # Bottom text
    canvas_obj.setFillColor(HexColor('#6b7280'))
    canvas_obj.setFont('Helvetica', 9)
    canvas_obj.drawCentredString(W/2, 12*mm, 'Confidential — For Internal Use Only')
    canvas_obj.restoreState()

# Use a blank first page for cover
from reportlab.platypus import FrameBreak

class CoverPage(BaseDocTemplate):
    pass

# Draw cover using canvas directly — add as first page via onPage
story.append(Spacer(1, H - 40*mm))  # placeholder — will be replaced

# ── We'll build the story and use onFirstPage for the cover ──
story = []

# ════════════════════════════════════════════════════════
# TABLE OF CONTENTS
# ════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(sp(8))
story.append(Paragraph('<b>Table of Contents</b>', S('TOC_T', fontName='Helvetica-Bold', fontSize=18, textColor=GRAY_900, spaceAfter=16, leading=24)))
story.append(hr(VIOLET, 1.5))
story.append(sp(4))

toc_entries = [
    ('1', 'Getting Started', [
        ('1.1', 'System Overview'),
        ('1.2', 'Logging In'),
        ('1.3', 'Dashboard'),
        ('1.4', 'Navigation'),
    ]),
    ('2', 'Company Settings', [
        ('2.1', 'Basic Information'),
        ('2.2', 'Province & Tax Authority'),
        ('2.3', 'FBR / PRAL Configuration'),
        ('2.4', 'Stock Settings'),
    ]),
    ('3', 'Products & PCT Codes', [
        ('3.1', 'PCT Codes'),
        ('3.2', 'Product Categories & Units'),
        ('3.3', 'Managing Products'),
    ]),
    ('4', 'Customers', [
        ('4.1', 'Adding a Customer'),
        ('4.2', 'NTN & STR# Verification'),
        ('4.3', 'Province & Tax Authority'),
    ]),
    ('5', 'Suppliers & Purchase Orders', [
        ('5.1', 'Managing Suppliers'),
        ('5.2', 'Creating a Purchase Order (PO)'),
        ('5.3', 'Receiving a PO — Stock Auto-Update'),
    ]),
    ('6', 'Inventory & Stock', [
        ('6.1', 'Warehouses'),
        ('6.2', 'Stock Levels'),
        ('6.3', 'Manual Stock Transactions'),
        ('6.4', 'Stock Alerts'),
    ]),
    ('7', 'Sales Invoices', [
        ('7.1', 'Creating an Invoice'),
        ('7.2', 'Invoice Status Flow'),
        ('7.3', 'FBR e-Invoice Submission'),
        ('7.4', 'Printing the Invoice'),
        ('7.5', 'Stock Auto-Deduction on Payment'),
    ]),
    ('8', 'Production Batches', [
        ('8.1', 'Creating a Batch'),
        ('8.2', 'Batch Status Flow'),
        ('8.3', 'Batch Inputs & Outputs'),
    ]),
    ('9', 'Accounts & Ledger', [
        ('9.1', 'Chart of Accounts'),
        ('9.2', 'Ledger Entries'),
    ]),
    ('10', 'Reports', [
        ('10.1', 'Sales Report'),
        ('10.2', 'Purchase Report'),
        ('10.3', 'Inventory Report'),
        ('10.4', 'Production Report'),
    ]),
    ('11', 'User Management', [
        ('11.1', 'User Roles'),
        ('11.2', 'Creating & Managing Users'),
    ]),
    ('12', 'FBR Integration Guide', [
        ('12.1', 'What FBR Receives'),
        ('12.2', 'Integration Steps'),
        ('12.3', 'Going Live'),
    ]),
]

for num, title, subs in toc_entries:
    story.append(Paragraph(f'<b>{num}. {title}</b>', style_toc))
    for snum, stitle in subs:
        story.append(Paragraph(f'{snum}  {stitle}', style_toc_sub))
    story.append(sp(2))

story.append(PageBreak())

# ════════════════════════════════════════════════════════
# SECTION 1: GETTING STARTED
# ════════════════════════════════════════════════════════
story.append(section_header_box('1', 'Getting Started', 'Login, Dashboard & Navigation'))
story.append(sp(10))

story.append(h2('1.1  System Overview'))
story.append(p('The Textile Management System (TMS) is a complete business management solution built specifically for Pakistani textile mills and dyeing industries. It handles the full business cycle: purchasing raw materials, production processing, sales invoicing, inventory management, and FBR-compliant e-invoice submission.'))
story.append(sp(4))

story.append(info_box('What This System Manages', [
    'Sales Tax Invoices — FBR/PRAL compliant with IRN and QR code',
    'Customer records with NTN/STR# verification from FBR',
    'Supplier records and Purchase Orders (PO)',
    'Stock levels — auto-updated on PO receipt and invoice payment',
    'Production batches — dyeing, bleaching, printing, finishing',
    'Accounts and double-entry ledger',
    'Multi-user access with role-based permissions',
]))
story.append(sp(8))

story.append(h2('1.2  Logging In'))
story.append(step_table([
    ('Open the application', 'Open your browser and go to the system URL provided by your IT administrator.'),
    ('Enter credentials', 'Type your Username and Password. These are set up by the Admin user.'),
    ('Click Login', 'You will be taken to the Dashboard. Your session stays active for 1 day.'),
    ('Forgot password?', 'Contact your system administrator. They can reset your password from the Users page.'),
]))
story.append(sp(6))
story.append(note('Passwords must be at least 6 characters. Administrators set these in User Management.'))
story.append(sp(8))

story.append(h2('1.3  Dashboard'))
story.append(p('The Dashboard shows your business at a glance. All numbers are live from the database — refreshed every time you open the page.'))
story.append(sp(4))
story.append(two_col_table([
    ('Total Products', 'Count of all products in the system (active + inactive)'),
    ("Today's Sales", 'Total value of all invoices dated today (including sales tax)'),
    ('Pending Invoices', 'Count of invoices in Draft or Issued status not yet paid'),
    ('Low Stock Items', 'Products with 10 or fewer units — configurable in Settings'),
    ('Recent Invoices', 'Last 10 invoices with customer name, amount, and status'),
    ('Stock Alerts', 'Items running low with current quantity highlighted in amber/red'),
    ('Production Banner', 'Appears only when batches are In Progress — click to go to Production'),
    ('FBR / Company Card', 'Shows your company STR# and NTN# — or prompts setup if missing'),
], header=('Card / Panel', 'What It Shows')))
story.append(sp(8))

story.append(h2('1.4  Navigation'))
story.append(p('The left sidebar is always visible. Click any item to navigate. The active page is highlighted in purple. Your username and role appear at the bottom of the sidebar.'))
story.append(sp(4))
story.append(two_col_table([
    ('Dashboard',   'Live business overview'),
    ('Products',    'Product catalog and PCT codes'),
    ('Inventory',   'Stock levels, warehouses, transactions'),
    ('Suppliers',   'Supplier records'),
    ('Purchases',   'Purchase Orders (PO)'),
    ('Production',  'Dyeing/bleaching/printing batches'),
    ('Customers',   'Customer records with FBR verification'),
    ('Invoices',    'Sales Tax Invoices'),
    ('Accounts',    'Chart of accounts and ledger'),
    ('Reports',     'Sales, purchases, inventory, production analytics'),
    ('Users',       'User accounts and roles (Admin only)'),
    ('Settings',    'Company info, FBR config, stock rules'),
], header=('Menu Item', 'Purpose')))

story.append(PageBreak())

# ════════════════════════════════════════════════════════
# SECTION 2: SETTINGS
# ════════════════════════════════════════════════════════
story.append(section_header_box('2', 'Company Settings', 'Configure before first use'))
story.append(sp(10))

story.append(h2('2.1  Basic Information'))
story.append(p('Go to <b>Settings → Company</b>. Fill in all fields. This information appears on every printed invoice.'))
story.append(sp(4))
story.append(two_col_table([
    ('Company Name',    'Your registered business name — appears as heading on invoices'),
    ('Address',         'Registered business address'),
    ('Phone',           'Business phone number'),
    ('City',            'City of business'),
    ('STR#',            'Sales Tax Registration Number — e.g. 04-05-3200-009-46'),
    ('NTN#',            'National Tax Number — e.g. 2212360-1'),
    ('Email',           'Business email (optional)'),
    ('Website',         'Business website (optional)'),
    ('Logo',            'Company logo — appears on printed invoices (PNG/JPG, max 2MB)'),
], header=('Field', 'Description')))
story.append(sp(4))
story.append(note('STR# and NTN# are mandatory for FBR e-invoice submission. Without them, invoices cannot be submitted to FBR.'))
story.append(sp(8))

story.append(h2('2.2  Province & Tax Authority'))
story.append(p('This is critical for correct tax routing. Select your province — the system automatically sets the correct tax authority.'))
story.append(sp(4))
story.append(two_col_table([
    ('Punjab',               'PRA — Punjab Revenue Authority'),
    ('Sindh',                'SRB — Sindh Revenue Board'),
    ('Khyber Pakhtunkhwa',   'KPRA — KPK Revenue Authority'),
    ('Balochistan',          'BRA — Balochistan Revenue Authority'),
    ('Federal / Islamabad',  'FBR — Federal Board of Revenue'),
    ('AJK',                  'FBR — Federal Board of Revenue'),
    ('Gilgit-Baltistan',     'FBR — Federal Board of Revenue'),
], header=('Your Province', 'Tax Authority')))
story.append(sp(4))
story.append(p('<b>Business Type</b> also matters:'))
story.append(two_col_table([
    ('Goods',    'Raw material, fabric, yarn — always FBR regardless of province'),
    ('Services', 'Dyeing, bleaching, printing — provincial authority based on your province'),
    ('Both',     'Mixed business — handled per invoice'),
], header=('Business Type', 'Tax Routing')))
story.append(sp(4))
story.append(note('Textile dyeing and processing is classified as SERVICES by FBR. If you are in Punjab, your authority is PRA, not FBR. This is exactly the mistake the advocate\'s client made — the system now prevents it automatically.'))
story.append(sp(8))

story.append(h2('2.3  FBR / PRAL Configuration'))
story.append(p('Go to <b>Settings → FBR / PRAL</b>. This section configures the electronic invoice submission to FBR through PRAL (Pakistan Revenue Automation Ltd).'))
story.append(sp(4))
story.append(two_col_table([
    ('POS ID',          'Assigned by PRAL when you register your POS system on their portal'),
    ('POS Serial',      'Your system\'s serial number registered on PRAL'),
    ('API Username',    'PRAL ITMS portal API username'),
    ('API Password',    'PRAL ITMS portal API password'),
    ('Mode',            'Sandbox (testing) or Production (live). Always test first.'),
], header=('Field', 'Description')))
story.append(sp(4))
story.append(info_box('To Get PRAL Credentials', [
    'Call PRAL helpline: 051-111-772-527',
    'Ask to register your POS system for e-invoice API',
    'They will give you POS ID, username, and password',
    'Log in to PRAL ITMS portal: itms.fbr.gov.pk',
    'Test in Sandbox mode first before going Live',
]))
story.append(sp(8))

story.append(h2('2.4  Stock Settings'))
story.append(p('Go to <b>Settings → Stock</b>. These rules run automatically — no manual action needed.'))
story.append(sp(4))
story.append(two_col_table([
    ('Auto-deduct on Invoice Paid', 'When invoice status → Paid, quantities are deducted from stock automatically'),
    ('Auto-add on PO Received',     'When Purchase Order → Received, quantities are added to stock automatically'),
    ('Low Stock Threshold',         'Items at or below this quantity show on the Dashboard as alerts (default: 10)'),
], header=('Setting', 'Effect')))

story.append(PageBreak())

# ════════════════════════════════════════════════════════
# SECTION 3: PRODUCTS & PCT CODES
# ════════════════════════════════════════════════════════
story.append(section_header_box('3', 'Products & PCT Codes', 'Product catalog setup'))
story.append(sp(10))

story.append(h2('3.1  PCT Codes'))
story.append(p('PCT (Pakistan Customs Tariff) codes, also called HS codes, are mandatory on FBR sales tax invoices. Every product you sell must have a PCT code.'))
story.append(sp(4))
story.append(p('Go to <b>Products → PCT Codes</b>. Examples for textile products:'))
story.append(two_col_table([
    ('5208 2100', 'Woven fabrics, cotton, plain weave, bleached'),
    ('5208 3100', 'Woven fabrics, cotton, plain weave, dyed'),
    ('5209 4100', 'Woven fabrics, cotton, printed'),
    ('5513 2100', 'Woven fabrics, synthetic, plain weave, dyed'),
    ('3204 1100', 'Reactive dyes and preparations'),
    ('3402 9010', 'Washing, bleaching, scouring preparations'),
], header=('PCT Code', 'Description')))
story.append(sp(4))
story.append(tip('Ask your FBR tax consultant for the exact PCT codes for your products. Wrong PCT codes can cause FBR to reject your invoices.'))
story.append(sp(8))

story.append(h2('3.2  Categories & Units'))
story.append(p('Before adding products, set up <b>Categories</b> (e.g. Grey Cloth, Dyed Fabric, Chemicals) and <b>Units</b> (e.g. Metres, Yards, Kg, Litre). These appear in purchase orders, invoices, and stock reports.'))
story.append(sp(8))

story.append(h2('3.3  Managing Products'))
story.append(step_table([
    ('Go to Products', 'Click Products in the sidebar.'),
    ('Click New Product', 'Fill in: Name, Category, Unit, PCT Code, and prices.'),
    ('Set prices', 'Wholesale Price and Retail Price — used for stock value estimation in reports.'),
    ('Save', 'Product appears in the list and is available for invoices and purchase orders.'),
]))
story.append(sp(4))
story.append(note('A product must have a PCT Code assigned before it can be used on FBR e-invoices. Invoices can still be created without it but FBR submission will include a blank HS Code.'))

story.append(PageBreak())

# ════════════════════════════════════════════════════════
# SECTION 4: CUSTOMERS
# ════════════════════════════════════════════════════════
story.append(section_header_box('4', 'Customers', 'FBR-verified customer records'))
story.append(sp(10))

story.append(h2('4.1  Adding a Customer'))
story.append(step_table([
    ('Go to Customers', 'Click Customers in the sidebar, then Add Customer.'),
    ('Enter NTN or STR#', 'Type the customer\'s NTN or STR# in the blue verification panel at the top of the form.'),
    ('Click Verify', 'The system contacts FBR and auto-fills: business name, address, city, province, and STR#.'),
    ('Check Province', 'Confirm the province is correct — this determines which tax authority their invoices go to.'),
    ('Save Customer', 'All verified data is saved. A green "FBR Verified" badge appears in the customer list.'),
]))
story.append(sp(6))

story.append(h2('4.2  NTN & STR# Verification'))
story.append(p('This feature prevents the most common and costly mistake in Pakistani sales tax invoicing — wrong province routing which causes the buyer\'s input tax claim to be rejected.'))
story.append(sp(4))
story.append(two_col_table([
    ('Verify NTN button',    'Calls FBR API — returns registered name, address, city, province, STR#'),
    ('Verify STR# button',   'Calls FBR API — also detects province from STR# prefix'),
    ('STR# auto-detect',     'Province sets instantly as you type the STR# — no button click needed'),
    ('FBR Verified badge',   'Green badge in customer list confirms data is from FBR records'),
    ('Manual entry',         'Still possible if FBR API is unavailable — province dropdown always available'),
], header=('Feature', 'What It Does')))
story.append(sp(4))
story.append(note('NTN and STR# verification requires PRAL credentials to be configured. Without credentials, the STR# prefix province detection still works automatically.'))
story.append(sp(8))

story.append(h2('4.3  Province & Tax Authority'))
story.append(p('Province is a <b>dropdown — not a free-text field</b>. This prevents typing mistakes. The system also shows which tax authority will receive invoices for each customer:'))
story.append(sp(4))
story.append(info_box('Why Province Matters', [
    'Wrong province = tax goes to wrong authority (e.g. FBR instead of PRA)',
    'Buyer cannot claim input tax if the invoicing authority does not match their registration',
    'Buyer\'s refund gets stuck — as experienced by the advocate\'s client',
    'This system eliminates that risk by auto-detecting province from STR# prefix',
]))

story.append(PageBreak())

# ════════════════════════════════════════════════════════
# SECTION 5: SUPPLIERS & PURCHASE ORDERS
# ════════════════════════════════════════════════════════
story.append(section_header_box('5', 'Suppliers & Purchase Orders', 'Buy raw materials — stock auto-updates'))
story.append(sp(10))

story.append(h2('5.1  Managing Suppliers'))
story.append(p('Go to <b>Suppliers</b> in the sidebar. Add your raw material suppliers with their name, address, phone, NTN, and STR#. Mark inactive suppliers as Inactive — they stay in the system for historical records.'))
story.append(sp(8))

story.append(h2('5.2  Creating a Purchase Order (PO)'))
story.append(p('A Purchase Order is a document you create when buying raw materials from a supplier. It records what you ordered, the quantity, and the rate.'))
story.append(sp(4))
story.append(step_table([
    ('Go to Purchases', 'Click Purchases in the sidebar, then New Purchase Order.'),
    ('Select Supplier', 'Choose from your supplier list.'),
    ('Add Items', 'For each item: select product, enter quantity and rate. Sales tax rate is optional.'),
    ('Save as Draft', 'PO is saved. No stock change yet.'),
    ('Confirm', 'Mark status as Confirmed — indicates you have sent the PO to the supplier.'),
    ('Mark Received', 'When goods arrive — change status to Received. Stock is automatically updated.'),
]))
story.append(sp(6))

story.append(h2('5.3  Receiving a PO — Stock Auto-Update'))
story.append(p('When you mark a PO as <b>Received</b>, the system automatically:'))
story.append(sp(4))
story.append(info_box('What Happens Automatically on PO Received', [
    'Each item quantity is added to the default warehouse stock',
    'A Stock Transaction (IN) record is created for audit trail',
    'The reference "PO-XXXXX" is saved on the transaction',
    'Previous and new stock quantities are logged',
    'If a stock record does not exist for the product, it is created',
]))
story.append(sp(4))
story.append(note('A received PO cannot be deleted — the stock has already been updated. Cancel it first if there was an error, then create a correcting manual stock adjustment.'))

story.append(PageBreak())

# ════════════════════════════════════════════════════════
# SECTION 6: INVENTORY
# ════════════════════════════════════════════════════════
story.append(section_header_box('6', 'Inventory & Stock', 'Warehouses, stock levels, transactions'))
story.append(sp(10))

story.append(h2('6.1  Warehouses'))
story.append(p('Go to <b>Inventory</b>. Create at least one warehouse before using the system. The first warehouse you create becomes the default warehouse for automatic stock updates.'))
story.append(sp(4))
story.append(tip('Name your warehouses clearly: "Main Store", "Chemical Store", "Finished Goods" etc. Stock is tracked separately per warehouse.'))
story.append(sp(8))

story.append(h2('6.2  Stock Levels'))
story.append(p('The Inventory page shows current stock for every product in every warehouse. Columns shown:'))
story.append(two_col_table([
    ('Product',       'Product name'),
    ('Warehouse',     'Which warehouse holds this stock'),
    ('Quantity',      'Current balance'),
    ('Unit',          'Unit of measurement (Metres, Kg, Litres, etc.)'),
    ('Est. Value',    'Quantity × Wholesale Price (from product settings)'),
], header=('Column', 'Meaning')))
story.append(sp(8))

story.append(h2('6.3  Manual Stock Transactions'))
story.append(p('For corrections or stock counts, create a manual transaction:'))
story.append(two_col_table([
    ('Stock IN',    'Add stock — e.g. returns from customer, opening balance'),
    ('Stock OUT',   'Remove stock — e.g. damaged goods, samples'),
    ('Adjustment',  'Set stock to a specific quantity — for stock count corrections'),
], header=('Type', 'When to Use')))
story.append(sp(4))
story.append(note('Stock Transactions are permanent audit records and cannot be deleted. If you make a mistake, create a reversing transaction.'))
story.append(sp(8))

story.append(h2('6.4  Stock Alerts'))
story.append(p('The Dashboard shows items at or below the Low Stock Threshold (default: 10 units). Items at zero show a red pulsing dot. Change the threshold in <b>Settings → Stock</b>.'))

story.append(PageBreak())

# ════════════════════════════════════════════════════════
# SECTION 7: SALES INVOICES
# ════════════════════════════════════════════════════════
story.append(section_header_box('7', 'Sales Invoices', 'FBR-compliant Sales Tax Invoices'))
story.append(sp(10))

story.append(h2('7.1  Creating an Invoice'))
story.append(step_table([
    ('Go to Invoices', 'Click Invoices → New Invoice.'),
    ('Select Customer', 'Choose from your customer list. Name, NTN, STR#, and province are filled automatically.'),
    ('Set Date', 'Invoice date — defaults to today.'),
    ('Set Place of Supply', 'Province where the service/goods are supplied. Auto-filled from customer province. This field is legally critical.'),
    ('Add Items', 'For each item: Description, PCT/HS Code, Quantity (Mtr/Yds), Rate, Tax Rate (default 18%).'),
    ('Review Totals', 'System calculates: Value excl. tax, Sales Tax Amount, Value incl. tax automatically.'),
    ('Save as Draft', 'Invoice is saved. Can still be edited.'),
]))
story.append(sp(6))

story.append(h2('7.2  Invoice Status Flow'))
story.append(sp(4))
story.append(two_col_table([
    ('Draft',      'Created but not yet issued. Can be edited freely.'),
    ('Issued',     'Sent to customer. FBR submission happens automatically at this step. Cannot be deleted.'),
    ('Paid',       'Payment received. Stock is automatically deducted at this step.'),
    ('Cancelled',  'Invoice voided. No stock or FBR effect.'),
], header=('Status', 'Meaning & Action')))
story.append(sp(4))
story.append(note('Issued and Paid invoices cannot be deleted. Change status to Cancelled if you need to void them. This preserves the audit trail.'))
story.append(sp(8))

story.append(h2('7.3  FBR e-Invoice Submission'))
story.append(p('When you change an invoice status to <b>Issued</b>, the system automatically submits it to PRAL/FBR. This happens in the background — you do not need to do anything extra.'))
story.append(sp(4))
story.append(two_col_table([
    ('Accepted',   'FBR received and validated the invoice. IRN and QR code are saved.'),
    ('Error',      'FBR rejected or connection failed. Error message saved. Invoice is still Issued.'),
    ('Pending',    'FBR credentials not yet configured. Configure in Settings → FBR / PRAL.'),
], header=('FBR Status', 'Meaning')))
story.append(sp(4))
story.append(tip('If FBR submission fails, the invoice is still saved as Issued. You can retry by checking Settings → FBR / PRAL for configuration errors.'))
story.append(sp(8))

story.append(h2('7.4  Printing the Invoice'))
story.append(p('Click the Print button on any invoice. The print view shows a professional A4 Sales Tax Invoice layout matching FBR\'s required format:'))
story.append(sp(4))
story.append(info_box('What Appears on the Printed Invoice', [
    'Company logo, name, address, STR#, NTN#',
    'Buyer name, address, STR# (if registered), NTN',
    'Invoice number, date, Place of Supply',
    'Items table: Description, HS Code, Qty, Value excl. tax, Tax Rate, Tax Amount, Value incl. tax',
    'Grand totals row',
    'FBR IRN (Invoice Reference Number) — after successful FBR submission',
    'QR code — buyer can scan to verify invoice on iris.fbr.gov.pk',
    'Signature block',
]))
story.append(sp(8))

story.append(h2('7.5  Stock Auto-Deduction on Payment'))
story.append(p('When you mark an invoice as <b>Paid</b>, stock is automatically deducted for every product on the invoice. A Stock Transaction (OUT) record is created with the invoice number as reference.'))
story.append(sp(4))
story.append(note('If stock goes below zero due to insufficient stock, the deduction stops at zero. A warning is logged. Create a manual Stock IN transaction to correct the balance.'))

story.append(PageBreak())

# ════════════════════════════════════════════════════════
# SECTION 8: PRODUCTION BATCHES
# ════════════════════════════════════════════════════════
story.append(section_header_box('8', 'Production Batches', 'Dyeing, bleaching, printing & processing'))
story.append(sp(10))

story.append(h2('8.1  Creating a Batch'))
story.append(step_table([
    ('Go to Production', 'Click Production in the sidebar, then New Batch.'),
    ('Set Batch Number', 'Auto-generated (e.g. BATCH-0001) but can be changed.'),
    ('Select Process Type', 'Dyeing / Bleaching / Printing / Weaving / Finishing / Washing / Other.'),
    ('Set Dates', 'Start Date (required) and End Date (optional — fill when complete).'),
    ('Add Inputs', 'Raw materials going into this batch — select product and quantity.'),
    ('Add Outputs', 'Finished products coming out — select product and quantity.'),
    ('Create', 'Batch saved as Pending.'),
]))
story.append(sp(8))

story.append(h2('8.2  Batch Status Flow'))
story.append(two_col_table([
    ('Pending',     'Batch created, not started yet.'),
    ('In Progress', 'Processing has started. Click "Start" button.'),
    ('Completed',   'Processing finished. Click "Complete" button.'),
    ('Cancelled',   'Batch voided. Click "Cancel" button.'),
], header=('Status', 'Meaning')))
story.append(sp(4))
story.append(note('Completed batches cannot be deleted — they are permanent production records.'))
story.append(sp(8))

story.append(h2('8.3  Batch Inputs & Outputs'))
story.append(p('<b>Inputs</b> are the raw materials consumed in the process (e.g. grey cloth, dyes, chemicals). <b>Outputs</b> are the finished goods produced (e.g. dyed fabric, bleached cloth).'))
story.append(sp(4))
story.append(tip('Stock for batch inputs and outputs is NOT automatically updated — create manual Stock transactions for production movements. This gives you full control over stock timing.'))

story.append(PageBreak())

# ════════════════════════════════════════════════════════
# SECTION 9: ACCOUNTS & LEDGER
# ════════════════════════════════════════════════════════
story.append(section_header_box('9', 'Accounts & Ledger', 'Chart of accounts and bookkeeping'))
story.append(sp(10))

story.append(h2('9.1  Chart of Accounts'))
story.append(p('Go to <b>Accounts</b>. Create your chart of accounts before adding ledger entries.'))
story.append(two_col_table([
    ('Asset',       'What you own — cash, receivables, inventory, equipment'),
    ('Liability',   'What you owe — payables, loans'),
    ('Equity',      'Owner\'s capital and retained earnings'),
    ('Income',      'Sales revenue, other income'),
    ('Expense',     'Cost of goods, salaries, utilities, rent'),
], header=('Account Type', 'Examples')))
story.append(sp(4))
story.append(p('Accounts can have parent accounts to create a hierarchy (e.g. "Cash" under "Assets"). Set <b>Active</b> toggle — only active accounts appear in ledger entry forms.'))
story.append(sp(8))

story.append(h2('9.2  Ledger Entries'))
story.append(p('Each ledger entry is either a <b>Debit (DR)</b> or <b>Credit (CR)</b>. The system tracks running totals and net balance.'))
story.append(sp(4))
story.append(note('Ledger entries are permanent financial records and cannot be deleted. If a mistake is made, create a reversing entry.'))
story.append(sp(4))
story.append(tip('Add a Reference (e.g. invoice number, PO number) to link entries to transactions for easy auditing.'))

story.append(PageBreak())

# ════════════════════════════════════════════════════════
# SECTION 10: REPORTS
# ════════════════════════════════════════════════════════
story.append(section_header_box('10', 'Reports', 'Business analytics and summaries'))
story.append(sp(10))

story.append(h2('10.1  Sales Report'))
story.append(p('Shows all invoices in the selected date range. Key metrics:'))
story.append(two_col_table([
    ('Total Sales',         'Grand total of all invoices incl. sales tax'),
    ('Sales Tax Collected', 'Total 18% sales tax on all issued/paid invoices'),
    ('Monthly Revenue',     'Bar chart — revenue per month in the period'),
    ('Top Customers',       'Top 6 customers by revenue with bar chart'),
    ('Invoice Detail',      'Full table: invoice #, customer, date, status, amounts'),
    ('Grand Total row',     'Sum of excl. tax + tax + incl. tax'),
], header=('Metric', 'Description')))
story.append(sp(8))

story.append(h2('10.2  Purchase Report'))
story.append(two_col_table([
    ('Total POs',       'Count and total value of all purchase orders'),
    ('Top Suppliers',   'Top 6 suppliers by purchase value'),
    ('Status Breakdown','Count of Draft / Confirmed / Received / Cancelled POs'),
], header=('Metric', 'Description')))
story.append(sp(8))

story.append(h2('10.3  Inventory Report'))
story.append(two_col_table([
    ('Stock Levels',    'All products with warehouse, quantity, unit, estimated value'),
    ('Total Value',     'Sum of all stock estimated at wholesale price'),
    ('Product Count',   'Total and active product count'),
], header=('Metric', 'Description')))
story.append(sp(8))

story.append(h2('10.4  Production Report'))
story.append(two_col_table([
    ('Batch Status',     'Count of Pending / In Progress / Completed / Cancelled batches'),
    ('By Process Type',  'Bar chart — how many batches per dyeing/bleaching/printing etc.'),
    ('Completion Rate',  'Percentage of batches successfully completed'),
    ('Batch Table',      'Recent batches with inputs, outputs, and status'),
], header=('Metric', 'Description')))

story.append(PageBreak())

# ════════════════════════════════════════════════════════
# SECTION 11: USER MANAGEMENT
# ════════════════════════════════════════════════════════
story.append(section_header_box('11', 'User Management', 'Roles, access, and accounts'))
story.append(sp(10))

story.append(h2('11.1  User Roles'))
story.append(p('Each user has a role that determines their access level. Currently all roles have the same access — role-based restrictions can be configured by your developer.'))
story.append(sp(4))
story.append(two_col_table([
    ('Admin',           'Full system access — manages users, settings, all modules'),
    ('Manager',         'Business management — invoices, reports, purchases, production'),
    ('Cashier',         'Invoice creation and payment recording'),
    ('Factory Worker',  'Production batch management only'),
    ('Accountant',      'Accounts, ledger, and financial reports'),
], header=('Role', 'Intended Access')))
story.append(sp(8))

story.append(h2('11.2  Creating & Managing Users'))
story.append(step_table([
    ('Go to Users', 'Click Users in the sidebar (Admin only).'),
    ('Click New User', 'Fill in: Username (cannot be changed later), Name, Email, Phone, Role, Password.'),
    ('Set Password', 'Minimum 6 characters. User should change it on first login.'),
    ('Activate/Deactivate', 'Use the toggle on each user card. Inactive users cannot log in.'),
    ('Edit User', 'Click Edit to change name, email, phone, role, or reset password. Username is fixed.'),
    ('Delete User', 'Click the red trash icon. You cannot delete your own account.'),
]))
story.append(sp(4))
story.append(note('You cannot delete your own account. To remove an admin, another admin must do it.'))

story.append(PageBreak())

# ════════════════════════════════════════════════════════
# SECTION 12: FBR INTEGRATION GUIDE
# ════════════════════════════════════════════════════════
story.append(section_header_box('12', 'FBR Integration Guide', 'Complete setup guide for first-time integration'))
story.append(sp(10))

story.append(h2('12.1  What FBR Receives Per Invoice'))
story.append(p('When you issue an invoice, your system sends this data to FBR through PRAL:'))
story.append(sp(4))
story.append(two_col_table([
    ('Your STR#',           'Seller\'s Sales Tax Registration Number'),
    ('Your NTN#',           'Seller\'s National Tax Number'),
    ('Your Business Name',  'From Company Settings'),
    ('Buyer Name',          'From Customer record'),
    ('Buyer STR#',          'Customer\'s STR# (if registered)'),
    ('Buyer NTN',           'Customer\'s NTN'),
    ('Invoice Number',      'Unique invoice number'),
    ('Invoice Date',        'Date of the invoice'),
    ('Place of Supply',     'Province where service/goods are supplied'),
    ('HS/PCT Codes',        'For each line item'),
    ('Quantities',          'For each line item'),
    ('Values',              'Excl. tax, tax amount, incl. tax — per item and total'),
    ('POS ID',              'Your registered POS system ID'),
], header=('Data Sent to FBR', 'Source in Your System')))
story.append(sp(4))
story.append(info_box('What FBR Does NOT Receive', [
    'Stock levels or inventory data',
    'Purchase orders or supplier information',
    'Production batches or processes',
    'Salaries, expenses, or internal accounts',
    'Any data you do not put on a Sales Tax Invoice',
]))
story.append(sp(8))

story.append(h2('12.2  Integration Steps'))
story.append(step_table([
    ('Verify FBR Registration', 'Confirm business is registered on FBR Iris portal (iris.fbr.gov.pk) with an active STR#.'),
    ('Call PRAL Helpline', 'Call 051-111-772-527. Request POS registration for e-invoice API. They provide POS ID, username, and password.'),
    ('Enter Company Info', 'Go to Settings → Company. Fill STR#, NTN#, Province, Business Type.'),
    ('Enter PRAL Credentials', 'Go to Settings → FBR / PRAL. Enter POS ID, username, password. Keep Mode = Sandbox.'),
    ('Add .env Credentials', 'Developer adds PRAL_POS_ID, PRAL_USERNAME, PRAL_PASSWORD, PRAL_ENV=sandbox to server .env file and restarts server.'),
    ('Test in Sandbox', 'Create a test invoice. Issue it. Check the invoice record has an FBR IRN number. If yes — working.'),
    ('Switch to Production', 'Change PRAL_ENV=production in .env file. Restart server. Now live.'),
]))
story.append(sp(6))

story.append(h2('12.3  Going Live Checklist'))
story.append(sp(4))

checklist_items = [
    'Company name, address, STR#, NTN# entered in Settings → Company',
    'Province and Business Type set correctly in Settings → Company',
    'Company logo uploaded',
    'At least one Warehouse created in Inventory',
    'Products added with PCT codes',
    'Customer records added and NTN/STR# verified',
    'PRAL credentials entered in Settings → FBR / PRAL',
    'PRAL_POS_ID, PRAL_USERNAME, PRAL_PASSWORD added to server .env',
    'Tested in Sandbox — confirmed IRN received on test invoice',
    'Switched PRAL_ENV=production in .env',
    'Created one live invoice — confirmed IRN and QR code on printout',
    'Staff trained on province selection and NTN verification process',
    'Changed Django SECRET_KEY in production .env',
    'Set DEBUG=False in production .env',
]

data = []
for item in checklist_items:
    data.append([
        Paragraph('□', S('CB', fontName='Helvetica', fontSize=12, textColor=VIOLET, alignment=TA_CENTER, leading=14)),
        Paragraph(item, S('CI', fontName='Helvetica', fontSize=9, textColor=GRAY_700, leading=13)),
    ])

t = Table(data, colWidths=[10*mm, W - 65*mm])
t.setStyle(TableStyle([
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('TOPPADDING', (0,0), (-1,-1), 5),
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ('LEFTPADDING', (0,0), (0,-1), 4),
    ('LEFTPADDING', (1,0), (1,-1), 8),
    ('LINEBELOW', (0,0), (-1,-2), 0.5, GRAY_200),
    ('ROWBACKGROUNDS', (0,0), (-1,-1), [white, GRAY_50]),
    ('BOX', (0,0), (-1,-1), 0.5, GRAY_200),
]))
story.append(t)
story.append(sp(8))

story.append(two_col_table([
    ('PRAL Helpline',    '051-111-772-527 — For e-invoice API registration'),
    ('FBR Helpline',     '051-111-772-372 — For STR/NTN registration issues'),
    ('FBR Iris Portal',  'iris.fbr.gov.pk — Manage your FBR tax profile'),
    ('PRAL ITMS Portal', 'itms.fbr.gov.pk — Manage POS and e-invoice settings'),
    ('FBR e-Invoice',    'fbr.gov.pk/einvoicing — Official documentation'),
], header=('Contact / Resource', 'Details')))

story.append(sp(10))
story.append(hr(VIOLET, 1))
story.append(sp(4))
story.append(Paragraph('Textile Management System — User Manual v1.0', S('F', fontName='Helvetica', fontSize=9, textColor=GRAY_500, alignment=TA_CENTER, leading=14)))
story.append(Paragraph(f'Generated {datetime.date.today().strftime("%d %B %Y")}', S('F2', fontName='Helvetica', fontSize=9, textColor=GRAY_500, alignment=TA_CENTER, leading=14)))

# ── Build PDF ────────────────────────────────────────────────────────────────
def on_first_page(canvas_obj, doc):
    cover_page(canvas_obj, doc)

def on_later_pages(canvas_obj, doc):
    canvas_obj.saveState()
    canvas_obj.setFillColor(GRAY_500)
    canvas_obj.setFont('Helvetica', 8)
    canvas_obj.drawCentredString(W/2, 12*mm, f'Textile Management System — User Manual   |   Page {doc.page}')
    canvas_obj.setStrokeColor(GRAY_200)
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(20*mm, 17*mm, W - 20*mm, 17*mm)
    canvas_obj.restoreState()

doc.build(
    story,
    onFirstPage=on_first_page,
    onLaterPages=on_later_pages,
)
print(f"PDF generated: {output_path}")
