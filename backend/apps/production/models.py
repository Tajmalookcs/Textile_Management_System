from django.db import models


class ProcessingBatch(models.Model):
    STATUS = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    batch_number = models.CharField(max_length=50, unique=True)
    process_type = models.CharField(max_length=100)  # Dyeing, Printing, Bleaching, etc.
    status = models.CharField(max_length=20, choices=STATUS, default='pending')
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey('users.User', on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Processing Batch'
        verbose_name_plural = 'Processing Batches'

    def __str__(self):
        return f"Batch {self.batch_number} - {self.process_type}"


class BatchInput(models.Model):
    batch = models.ForeignKey(ProcessingBatch, related_name='inputs', on_delete=models.CASCADE)
    product = models.ForeignKey('products.Product', on_delete=models.PROTECT)
    quantity = models.DecimalField(max_digits=12, decimal_places=3)

    class Meta:
        verbose_name = 'Batch Input'
        verbose_name_plural = 'Batch Inputs'

    def __str__(self):
        return f"{self.product} x {self.quantity} -> {self.batch}"


class BatchOutput(models.Model):
    batch = models.ForeignKey(ProcessingBatch, related_name='outputs', on_delete=models.CASCADE)
    product = models.ForeignKey('products.Product', on_delete=models.PROTECT)
    quantity = models.DecimalField(max_digits=12, decimal_places=3)

    class Meta:
        verbose_name = 'Batch Output'
        verbose_name_plural = 'Batch Outputs'

    def __str__(self):
        return f"{self.product} x {self.quantity} <- {self.batch}"
