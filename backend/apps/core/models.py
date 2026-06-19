from django.db import models


class CompanySettings(models.Model):
    name = models.CharField(max_length=255)
    logo = models.ImageField(upload_to='logos/', null=True, blank=True)
    address = models.TextField()
    phone = models.CharField(max_length=100)
    str_number = models.CharField(max_length=100, verbose_name='STR#')  # Sales Tax Registration
    ntn_number = models.CharField(max_length=100, verbose_name='NTN#')  # National Tax Number
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    city = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Company Settings'
        verbose_name_plural = 'Company Settings'

    def __str__(self):
        return self.name
