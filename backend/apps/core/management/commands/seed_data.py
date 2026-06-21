from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
from decimal import Decimal


class Command(BaseCommand):
    help = 'Seed database with sample data for testing'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding data...')

        self._seed_users()
        self._seed_company()
        self._seed_accounts()
        self._seed_products()
        self._seed_warehouse()
        self._seed_suppliers()
        self._seed_customers()
        self._seed_purchase_orders()
        self._seed_invoices()

        self.stdout.write(self.style.SUCCESS('Done! Sample data created successfully.'))

    def _seed_users(self):
        from apps.users.models import User
        users = [
            dict(username='admin',    password='admin123',    role='admin',          first_name='Admin',   last_name='User',    email='admin@textile.com',    phone='0300-1111111', is_staff=True, is_superuser=True),
            dict(username='manager',  password='manager123',  role='manager',        first_name='Ahmed',   last_name='Khan',    email='ahmed@textile.com',    phone='0300-2222222'),
            dict(username='cashier1', password='cashier123',  role='cashier',        first_name='Sara',    last_name='Ali',     email='sara@textile.com',     phone='0300-3333333'),
            dict(username='accountant',password='acc123',     role='accountant',     first_name='Bilal',   last_name='Malik',   email='bilal@textile.com',    phone='0300-4444444'),
            dict(username='worker1',  password='worker123',   role='factory_worker', first_name='Usman',   last_name='Shah',    email='usman@textile.com',    phone='0300-5555555'),
        ]
        for u in users:
            pwd = u.pop('password')
            obj, created = User.objects.get_or_create(username=u['username'], defaults=u)
            if created:
                obj.set_password(pwd)
                obj.save()
                self.stdout.write(f'  Created user: {obj.username}')

    def _seed_company(self):
        from apps.core.models import CompanySettings
        if not CompanySettings.objects.exists():
            CompanySettings.objects.create(
                name='Al-Hamza Textile Mills',
                address='Plot 12, SITE Industrial Area, Lahore',
                phone='042-35123456',
                str_number='STR-2024-LHR-00123',
                ntn_number='1234567-8',
                email='info@alhamzatextile.com',
                website='https://alhamzatextile.com',
                city='Lahore',
                province='punjab',
                business_type='goods',
            )
            self.stdout.write('  Created company settings')

    def _seed_accounts(self):
        from apps.accounts.models import Account
        accounts = [
            ('Cash in Hand',        'asset'),
            ('Bank Account - HBL',  'asset'),
            ('Accounts Receivable', 'asset'),
            ('Inventory Asset',     'asset'),
            ('Accounts Payable',    'liability'),
            ('Sales Tax Payable',   'liability'),
            ('Owner Equity',        'equity'),
            ('Sales Revenue',       'income'),
            ('Other Income',        'income'),
            ('Cost of Goods Sold',  'expense'),
            ('Salaries Expense',    'expense'),
            ('Utilities Expense',   'expense'),
            ('Rent Expense',        'expense'),
        ]
        for name, atype in accounts:
            obj, created = Account.objects.get_or_create(name=name, defaults={'account_type': atype})
            if created:
                self.stdout.write(f'  Created account: {name}')

    def _seed_products(self):
        from apps.products.models import PCTCode, Category, Unit, Product

        pct_codes = [
            ('5208.1100', 'Woven fabrics of cotton, plain weave, <= 100g/m2'),
            ('5208.1200', 'Woven fabrics of cotton, plain weave, > 100g/m2'),
            ('5209.1100', 'Woven fabrics of cotton >= 85%, plain weave, > 200g/m2'),
            ('5513.1100', 'Woven fabrics of polyester staple fibres, plain weave'),
            ('6006.3100', 'Knitted or crocheted fabrics of synthetic fibres'),
        ]
        for code, desc in pct_codes:
            PCTCode.objects.get_or_create(pct_code=code, defaults={'description': desc})

        cat_fabric, _ = Category.objects.get_or_create(name='Fabric')
        cat_yarn, _   = Category.objects.get_or_create(name='Yarn')
        cat_garment, _ = Category.objects.get_or_create(name='Garments')

        unit_mtr, _ = Unit.objects.get_or_create(name='Meter',    defaults={'abbreviation': 'Mtr'})
        unit_kg, _  = Unit.objects.get_or_create(name='Kilogram', defaults={'abbreviation': 'Kg'})
        unit_pc, _  = Unit.objects.get_or_create(name='Piece',    defaults={'abbreviation': 'Pc'})
        unit_yds, _ = Unit.objects.get_or_create(name='Yard',     defaults={'abbreviation': 'Yds'})

        pct1 = PCTCode.objects.get(pct_code='5208.1100')
        pct2 = PCTCode.objects.get(pct_code='5208.1200')
        pct3 = PCTCode.objects.get(pct_code='5209.1100')
        pct4 = PCTCode.objects.get(pct_code='5513.1100')
        pct5 = PCTCode.objects.get(pct_code='6006.3100')

        products = [
            dict(name='Cotton Lawn 60x60',       category=cat_fabric,  unit=unit_mtr, pct_code=pct1, retail_price=350,  wholesale_price=300,  sales_tax_rate=18),
            dict(name='Cotton Poplin 45x45',      category=cat_fabric,  unit=unit_mtr, pct_code=pct1, retail_price=280,  wholesale_price=240,  sales_tax_rate=18),
            dict(name='Cotton Canvas Heavy',       category=cat_fabric,  unit=unit_mtr, pct_code=pct2, retail_price=420,  wholesale_price=370,  sales_tax_rate=18),
            dict(name='Pure Cotton Khaddar',       category=cat_fabric,  unit=unit_mtr, pct_code=pct3, retail_price=390,  wholesale_price=340,  sales_tax_rate=18),
            dict(name='Polyester Blended Fabric',  category=cat_fabric,  unit=unit_mtr, pct_code=pct4, retail_price=260,  wholesale_price=220,  sales_tax_rate=18),
            dict(name='Knitted Jersey Fabric',     category=cat_fabric,  unit=unit_mtr, pct_code=pct5, retail_price=310,  wholesale_price=265,  sales_tax_rate=18),
            dict(name='Cotton Carded Yarn 20s',    category=cat_yarn,    unit=unit_kg,  pct_code=None, retail_price=1200, wholesale_price=1050, sales_tax_rate=18),
            dict(name='Cotton Combed Yarn 30s',    category=cat_yarn,    unit=unit_kg,  pct_code=None, retail_price=1450, wholesale_price=1280, sales_tax_rate=18),
            dict(name='Polyester Yarn 150D',       category=cat_yarn,    unit=unit_kg,  pct_code=None, retail_price=980,  wholesale_price=850,  sales_tax_rate=18),
            dict(name='Men Kameez Shalwar',        category=cat_garment, unit=unit_pc,  pct_code=None, retail_price=1800, wholesale_price=1500, sales_tax_rate=18),
            dict(name='Ladies Suit Unstitched',    category=cat_garment, unit=unit_pc,  pct_code=None, retail_price=2200, wholesale_price=1900, sales_tax_rate=18),
        ]
        for p in products:
            obj, created = Product.objects.get_or_create(name=p['name'], defaults=p)
            if created:
                self.stdout.write(f'  Created product: {obj.name}')

    def _seed_warehouse(self):
        from apps.inventory.models import Warehouse, Stock, StockTransaction
        from apps.products.models import Product
        from apps.users.models import User

        admin = User.objects.get(username='admin')

        wh_main, created = Warehouse.objects.get_or_create(name='Main Warehouse', defaults={'location': 'Plot 12, SITE Industrial Area, Lahore'})
        wh_store, _      = Warehouse.objects.get_or_create(name='Retail Store',   defaults={'location': 'Liberty Market, Lahore'})

        if created:
            self.stdout.write('  Created warehouses')

        stock_data = {
            'Cotton Lawn 60x60':      (500, 200),
            'Cotton Poplin 45x45':    (800, 300),
            'Cotton Canvas Heavy':    (350, 100),
            'Pure Cotton Khaddar':    (600, 250),
            'Polyester Blended Fabric': (450, 180),
            'Knitted Jersey Fabric':  (300, 120),
            'Cotton Carded Yarn 20s': (200, 50),
            'Cotton Combed Yarn 30s': (150, 40),
            'Polyester Yarn 150D':    (180, 60),
            'Men Kameez Shalwar':     (100, 80),
            'Ladies Suit Unstitched': (80,  60),
        }

        for product_name, (main_qty, store_qty) in stock_data.items():
            try:
                product = Product.objects.get(name=product_name)
            except Product.DoesNotExist:
                continue
            for wh, qty in [(wh_main, main_qty), (wh_store, store_qty)]:
                stock, created = Stock.objects.get_or_create(product=product, warehouse=wh, defaults={'quantity': qty})
                if not created:
                    continue
                StockTransaction.objects.create(
                    product=product, warehouse=wh,
                    transaction_type='in', quantity=qty,
                    reference='SEED', notes='Initial stock', created_by=admin,
                )
        self.stdout.write('  Created stock')

    def _seed_suppliers(self):
        from apps.purchases.models import Supplier
        suppliers = [
            dict(name='Sapphire Textile Ltd',     address='Gulberg III, Lahore',         phone='042-35761234', ntn='2345678-9', str_number='PRA-2023-00456'),
            dict(name='Nishat Mills',              address='Ferozepur Road, Lahore',      phone='042-35801234', ntn='3456789-0', str_number='PRA-2023-00789'),
            dict(name='Gul Ahmed Textile',         address='Korangi Industrial, Karachi', phone='021-35121234', ntn='4567890-1', str_number='SRB-2023-00123'),
            dict(name='Al-Karam Textile',          address='S.I.T.E, Karachi',            phone='021-32561234', ntn='5678901-2', str_number='SRB-2023-00456'),
            dict(name='Master Yarn Traders',       address='Sheikhupura Road, Lahore',    phone='042-37891234', ntn='',         str_number=''),
        ]
        for s in suppliers:
            obj, created = Supplier.objects.get_or_create(name=s['name'], defaults=s)
            if created:
                self.stdout.write(f'  Created supplier: {obj.name}')

    def _seed_customers(self):
        from apps.sales.models import Customer
        customers = [
            dict(name='Junaid Jamshed Pvt Ltd',   address='Blue Area, Islamabad',      phone='051-2871234', ntn='6789012-3', str_number='FBR-2023-00123', province='federal',  city='Islamabad',  ntn_verified=True),
            dict(name='Alkaram Studio',            address='Clifton, Karachi',          phone='021-35671234',ntn='7890123-4', str_number='SRB-2023-00789', province='sindh',    city='Karachi',    ntn_verified=True),
            dict(name='Bonanza Satrangi',          address='DHA Phase 5, Lahore',       phone='042-35231234',ntn='8901234-5', str_number='PRA-2023-01234', province='punjab',   city='Lahore',     ntn_verified=True),
            dict(name='Chenone Stores',            address='MM Alam Road, Lahore',      phone='042-35671234',ntn='9012345-6', str_number='PRA-2023-01567', province='punjab',   city='Lahore',     ntn_verified=False),
            dict(name='Ideas by Gul Ahmed',        address='Tariq Road, Karachi',       phone='021-34561234',ntn='',          str_number='',               province='sindh',    city='Karachi',    ntn_verified=False),
            dict(name='Khaadi Retail',             address='Gulshan-e-Iqbal, Karachi',  phone='021-34891234',ntn='0123456-7', str_number='SRB-2023-01890', province='sindh',    city='Karachi',    ntn_verified=True),
            dict(name='Limelight Stores',          address='Liberty Market, Lahore',    phone='042-35991234',ntn='',          str_number='',               province='punjab',   city='Lahore',     ntn_verified=False),
            dict(name='Sana Safinaz Pvt Ltd',      address='Gulberg II, Lahore',        phone='042-35341234',ntn='1234567-9', str_number='PRA-2023-02123', province='punjab',   city='Lahore',     ntn_verified=True),
        ]
        for c in customers:
            obj, created = Customer.objects.get_or_create(name=c['name'], defaults=c)
            if created:
                self.stdout.write(f'  Created customer: {obj.name}')

    def _seed_purchase_orders(self):
        from apps.purchases.models import Supplier, PurchaseOrder, PurchaseOrderItem
        from apps.products.models import Product
        from apps.users.models import User

        admin = User.objects.get(username='admin')

        if PurchaseOrder.objects.exists():
            return

        supplier1 = Supplier.objects.get(name='Sapphire Textile Ltd')
        supplier2 = Supplier.objects.get(name='Nishat Mills')

        po1 = PurchaseOrder.objects.create(
            po_number='PO-2026-001', supplier=supplier1,
            date=date.today() - timedelta(days=30),
            status='received', created_by=admin,
            notes='Monthly fabric purchase',
        )
        for name, qty, rate in [
            ('Cotton Lawn 60x60',  500, 280),
            ('Cotton Poplin 45x45', 800, 220),
        ]:
            PurchaseOrderItem.objects.create(
                po=po1, product=Product.objects.get(name=name),
                quantity=qty, rate=rate, sales_tax_rate=18,
            )

        po2 = PurchaseOrder.objects.create(
            po_number='PO-2026-002', supplier=supplier2,
            date=date.today() - timedelta(days=15),
            status='confirmed', created_by=admin,
            notes='Khaddar and canvas order',
        )
        for name, qty, rate in [
            ('Pure Cotton Khaddar',   600, 320),
            ('Cotton Canvas Heavy',   350, 350),
        ]:
            PurchaseOrderItem.objects.create(
                po=po2, product=Product.objects.get(name=name),
                quantity=qty, rate=rate, sales_tax_rate=18,
            )

        self.stdout.write('  Created purchase orders')

    def _seed_invoices(self):
        from apps.sales.models import Customer, Invoice, InvoiceItem
        from apps.products.models import Product, PCTCode
        from apps.users.models import User

        admin = User.objects.get(username='admin')

        if Invoice.objects.exists():
            return

        invoices_data = [
            dict(
                invoice_number='INV-2026-001',
                customer='Bonanza Satrangi',
                date=date.today() - timedelta(days=20),
                status='paid',
                place_of_supply='punjab',
                items=[
                    ('Cotton Lawn 60x60',     200, 350),
                    ('Cotton Poplin 45x45',   300, 280),
                ],
            ),
            dict(
                invoice_number='INV-2026-002',
                customer='Alkaram Studio',
                date=date.today() - timedelta(days=10),
                status='issued',
                place_of_supply='sindh',
                items=[
                    ('Knitted Jersey Fabric', 150, 310),
                    ('Polyester Blended Fabric', 200, 260),
                ],
            ),
            dict(
                invoice_number='INV-2026-003',
                customer='Khaadi Retail',
                date=date.today() - timedelta(days=5),
                status='draft',
                place_of_supply='sindh',
                items=[
                    ('Pure Cotton Khaddar',   100, 390),
                    ('Cotton Canvas Heavy',    80, 420),
                    ('Cotton Lawn 60x60',      50, 350),
                ],
            ),
            dict(
                invoice_number='INV-2026-004',
                customer='Sana Safinaz Pvt Ltd',
                date=date.today() - timedelta(days=2),
                status='issued',
                place_of_supply='punjab',
                items=[
                    ('Ladies Suit Unstitched', 40, 2200),
                    ('Men Kameez Shalwar',      60, 1800),
                ],
            ),
        ]

        for inv_data in invoices_data:
            customer = Customer.objects.get(name=inv_data['customer'])
            inv = Invoice.objects.create(
                invoice_number=inv_data['invoice_number'],
                customer=customer,
                date=inv_data['date'],
                status=inv_data['status'],
                place_of_supply=inv_data['place_of_supply'],
                created_by=admin,
            )
            for product_name, qty, rate in inv_data['items']:
                product = Product.objects.get(name=product_name)
                InvoiceItem.objects.create(
                    invoice=inv, product=product,
                    pct_code=product.pct_code,
                    description=product.name,
                    quantity=qty, rate=rate,
                    sales_tax_rate=product.sales_tax_rate,
                )
            self.stdout.write(f'  Created invoice: {inv.invoice_number}')
