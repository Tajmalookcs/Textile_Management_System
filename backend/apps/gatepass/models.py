from django.db import models


class InwardGatePass(models.Model):
    STATUS = [
        ('pending',  'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    gate_pass_number = models.CharField(max_length=30, unique=True, verbose_name='Gate Pass No.')
    date             = models.DateField()
    time             = models.TimeField()
    supplier         = models.ForeignKey('purchases.Supplier', null=True, blank=True, on_delete=models.SET_NULL)
    supplier_name    = models.CharField(max_length=255, blank=True, verbose_name='Supplier / Party Name')
    vehicle_number   = models.CharField(max_length=50, blank=True, verbose_name='Vehicle No.')
    driver_name      = models.CharField(max_length=150, blank=True)
    driver_cnic      = models.CharField(max_length=20, blank=True, verbose_name='Driver CNIC')
    purchase_order   = models.ForeignKey('purchases.PurchaseOrder', null=True, blank=True, on_delete=models.SET_NULL, verbose_name='PO Reference')
    received_by      = models.CharField(max_length=150, blank=True)
    security_officer = models.CharField(max_length=150, blank=True)
    remarks          = models.TextField(blank=True)
    status           = models.CharField(max_length=20, choices=STATUS, default='pending')
    created_by       = models.ForeignKey('users.User', on_delete=models.PROTECT)
    created_at       = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Inward Gate Pass'
        verbose_name_plural = 'Inward Gate Passes'
        ordering = ['-created_at']

    def __str__(self):
        return self.gate_pass_number


class InwardGatePassItem(models.Model):
    gate_pass   = models.ForeignKey(InwardGatePass, related_name='items', on_delete=models.CASCADE)
    description = models.CharField(max_length=255)
    quantity    = models.DecimalField(max_digits=12, decimal_places=3, default=0)
    unit        = models.CharField(max_length=50, blank=True)
    weight_kg   = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Weight (Kg)')
    remarks     = models.CharField(max_length=255, blank=True)

    class Meta:
        verbose_name = 'Inward Gate Pass Item'


class OutwardGatePass(models.Model):
    PURPOSE = [
        ('sale',     'Customer Sale / Delivery'),
        ('return',   'Return to Supplier'),
        ('transfer', 'Internal Transfer'),
        ('sample',   'Sample / Demo'),
        ('other',    'Other'),
    ]
    STATUS = [
        ('pending',  'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    gate_pass_number = models.CharField(max_length=30, unique=True, verbose_name='Gate Pass No.')
    date             = models.DateField()
    time             = models.TimeField()
    purpose          = models.CharField(max_length=20, choices=PURPOSE, default='sale')
    customer         = models.ForeignKey('sales.Customer', null=True, blank=True, on_delete=models.SET_NULL)
    party_name       = models.CharField(max_length=255, blank=True, verbose_name='Customer / Party Name')
    destination      = models.CharField(max_length=255, blank=True, verbose_name='Destination / Address')
    vehicle_number   = models.CharField(max_length=50, blank=True, verbose_name='Vehicle No.')
    driver_name      = models.CharField(max_length=150, blank=True)
    driver_cnic      = models.CharField(max_length=20, blank=True, verbose_name='Driver CNIC')
    invoice_ref      = models.CharField(max_length=50, blank=True, verbose_name='Invoice / DO Reference')
    dispatched_by    = models.CharField(max_length=150, blank=True)
    security_officer = models.CharField(max_length=150, blank=True)
    remarks          = models.TextField(blank=True)
    status           = models.CharField(max_length=20, choices=STATUS, default='pending')
    created_by       = models.ForeignKey('users.User', on_delete=models.PROTECT)
    created_at       = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Outward Gate Pass'
        verbose_name_plural = 'Outward Gate Passes'
        ordering = ['-created_at']

    def __str__(self):
        return self.gate_pass_number


class OutwardGatePassItem(models.Model):
    gate_pass   = models.ForeignKey(OutwardGatePass, related_name='items', on_delete=models.CASCADE)
    description = models.CharField(max_length=255)
    quantity    = models.DecimalField(max_digits=12, decimal_places=3, default=0)
    unit        = models.CharField(max_length=50, blank=True)
    weight_kg   = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Weight (Kg)')
    remarks     = models.CharField(max_length=255, blank=True)

    class Meta:
        verbose_name = 'Outward Gate Pass Item'
