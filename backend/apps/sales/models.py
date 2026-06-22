from django.db import models
from apps.core.models import PROVINCE_CHOICES


class Customer(models.Model):
    name       = models.CharField(max_length=255)
    address    = models.TextField(blank=True)
    phone      = models.CharField(max_length=100, blank=True)
    ntn        = models.CharField(max_length=100, blank=True, verbose_name='NTN#')
    str_number = models.CharField(max_length=100, blank=True, verbose_name='STR#')
    province   = models.CharField(max_length=20, choices=PROVINCE_CHOICES, blank=True, default='punjab', verbose_name='Province')
    city       = models.CharField(max_length=100, blank=True)
    is_active  = models.BooleanField(default=True)
    # FBR verified flag — set True after NTN lookup confirms this customer
    ntn_verified = models.BooleanField(default=False, verbose_name='NTN Verified')

    class Meta:
        verbose_name = 'Customer'
        verbose_name_plural = 'Customers'

    def __str__(self):
        return self.name


class Invoice(models.Model):
    STATUS = [
        ('draft',     'Draft'),
        ('issued',    'Issued'),
        ('paid',      'Paid'),
        ('cancelled', 'Cancelled'),
    ]
    FBR_STATUS = [
        ('pending',   'Pending'),
        ('submitted', 'Submitted'),
        ('accepted',  'Accepted'),
        ('rejected',  'Rejected'),
        ('error',     'Error'),
    ]

    invoice_number   = models.CharField(max_length=50, unique=True)
    customer         = models.ForeignKey(Customer, on_delete=models.PROTECT)
    date             = models.DateField()
    status           = models.CharField(max_length=20, choices=STATUS, default='draft')
    notes            = models.TextField(blank=True)
    created_by       = models.ForeignKey('users.User', on_delete=models.PROTECT)
    created_at       = models.DateTimeField(auto_now_add=True)

    # Place of supply — legally determines which tax authority gets the money
    place_of_supply  = models.CharField(max_length=20, choices=PROVINCE_CHOICES, default='punjab', verbose_name='Place of Supply')

    # FBR e-Invoice fields
    fbr_status       = models.CharField(max_length=20, choices=FBR_STATUS, default='pending')
    fbr_irn          = models.CharField(max_length=200, blank=True, verbose_name='FBR Invoice Reference Number')
    fbr_qr_code      = models.URLField(max_length=500, blank=True, verbose_name='FBR QR Code URL')
    fbr_submitted_at = models.DateTimeField(null=True, blank=True)
    fbr_error        = models.TextField(blank=True)

    # Credit Note fields
    is_credit_note       = models.BooleanField(default=False, verbose_name='Is Credit Note')
    original_invoice     = models.ForeignKey(
        'self', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='credit_notes', verbose_name='Original Invoice'
    )
    cancellation_reason  = models.TextField(blank=True, verbose_name='Cancellation / Credit Note Reason')

    class Meta:
        verbose_name = 'Invoice'
        verbose_name_plural = 'Invoices'

    def __str__(self):
        return f"INV-{self.invoice_number} ({self.customer})"

    @property
    def total_excl_tax(self):
        return sum(item.value_excl_tax for item in self.items.all())

    @property
    def total_tax(self):
        return sum(item.sales_tax_amount for item in self.items.all())

    @property
    def total_incl_tax(self):
        return self.total_excl_tax + self.total_tax


class InvoiceItem(models.Model):
    invoice        = models.ForeignKey(Invoice, related_name='items', on_delete=models.CASCADE)
    product        = models.ForeignKey('products.Product', null=True, blank=True, on_delete=models.SET_NULL)
    pct_code       = models.ForeignKey('products.PCTCode', null=True, blank=True, on_delete=models.SET_NULL)
    description    = models.CharField(max_length=255)
    quantity       = models.DecimalField(max_digits=12, decimal_places=3)
    rate           = models.DecimalField(max_digits=12, decimal_places=2)
    sales_tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.0)

    class Meta:
        verbose_name = 'Invoice Item'
        verbose_name_plural = 'Invoice Items'

    @property
    def value_excl_tax(self):
        return self.quantity * self.rate

    @property
    def sales_tax_amount(self):
        return self.value_excl_tax * self.sales_tax_rate / 100

    @property
    def value_incl_tax(self):
        return self.value_excl_tax + self.sales_tax_amount
