from django.db import models


class PCTCode(models.Model):
    pct_code = models.CharField(max_length=20, unique=True)
    description = models.TextField()

    class Meta:
        verbose_name = 'PCT Code'
        verbose_name_plural = 'PCT Codes'

    def __str__(self):
        return f"{self.pct_code} - {self.description[:60]}"


class Category(models.Model):
    name = models.CharField(max_length=100)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='children')

    class Meta:
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name


class Unit(models.Model):
    name = models.CharField(max_length=50)          # Meter, Yard, Kg, Piece
    abbreviation = models.CharField(max_length=10)  # Mtr, Yds, Kg, Pc

    class Meta:
        verbose_name = 'Unit'
        verbose_name_plural = 'Units'

    def __str__(self):
        return f"{self.name} ({self.abbreviation})"


class Product(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    pct_code = models.ForeignKey(PCTCode, null=True, blank=True, on_delete=models.SET_NULL)
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.SET_NULL)
    unit = models.ForeignKey(Unit, on_delete=models.PROTECT)
    sales_tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.0)
    retail_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    wholesale_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    barcode = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Product'
        verbose_name_plural = 'Products'

    def __str__(self):
        return self.name
