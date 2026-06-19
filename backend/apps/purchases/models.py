from django.db import models


class Supplier(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField()
    phone = models.CharField(max_length=100)
    ntn = models.CharField(max_length=100, blank=True, verbose_name='NTN#')
    str_number = models.CharField(max_length=100, blank=True, verbose_name='STR#')
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Supplier'
        verbose_name_plural = 'Suppliers'

    def __str__(self):
        return self.name


class PurchaseOrder(models.Model):
    STATUS = [
        ('draft', 'Draft'),
        ('confirmed', 'Confirmed'),
        ('received', 'Received'),
        ('cancelled', 'Cancelled'),
    ]
    po_number = models.CharField(max_length=50, unique=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT)
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS, default='draft')
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey('users.User', on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Purchase Order'
        verbose_name_plural = 'Purchase Orders'

    def __str__(self):
        return f"PO-{self.po_number} ({self.supplier})"

    @property
    def total_excl_tax(self):
        return sum(item.value_excl_tax for item in self.items.all())

    @property
    def total_tax(self):
        return sum(item.sales_tax_amount for item in self.items.all())

    @property
    def total_incl_tax(self):
        return self.total_excl_tax + self.total_tax


class PurchaseOrderItem(models.Model):
    po = models.ForeignKey(PurchaseOrder, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey('products.Product', on_delete=models.PROTECT)
    quantity = models.DecimalField(max_digits=12, decimal_places=3)
    rate = models.DecimalField(max_digits=12, decimal_places=2)
    sales_tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    class Meta:
        verbose_name = 'Purchase Order Item'
        verbose_name_plural = 'Purchase Order Items'

    def __str__(self):
        return f"{self.product} x {self.quantity}"

    @property
    def value_excl_tax(self):
        return self.quantity * self.rate

    @property
    def sales_tax_amount(self):
        return self.value_excl_tax * self.sales_tax_rate / 100

    @property
    def value_incl_tax(self):
        return self.value_excl_tax + self.sales_tax_amount
