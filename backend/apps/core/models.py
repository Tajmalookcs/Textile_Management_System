from django.db import models

PROVINCE_CHOICES = [
    ('punjab',      'Punjab'),
    ('sindh',       'Sindh'),
    ('kpk',         'Khyber Pakhtunkhwa (KPK)'),
    ('balochistan', 'Balochistan'),
    ('federal',     'Federal / Islamabad'),
    ('ajk',         'AJK'),
    ('gb',          'Gilgit-Baltistan'),
]

TAX_AUTHORITY_CHOICES = [
    ('fbr', 'FBR (Federal Board of Revenue)'),
    ('pra', 'PRA (Punjab Revenue Authority)'),
    ('srb', 'SRB (Sindh Revenue Board)'),
    ('kpra','KPRA (KPK Revenue Authority)'),
    ('bra', 'BRA (Balochistan Revenue Authority)'),
]

PROVINCE_TO_AUTHORITY = {
    'punjab':      'pra',
    'sindh':       'srb',
    'kpk':         'kpra',
    'balochistan': 'bra',
    'federal':     'fbr',
    'ajk':         'fbr',
    'gb':          'fbr',
}


class CompanySettings(models.Model):
    name        = models.CharField(max_length=255)
    logo        = models.ImageField(upload_to='logos/', null=True, blank=True)
    address     = models.TextField(blank=True)
    phone       = models.CharField(max_length=100, blank=True)
    str_number  = models.CharField(max_length=100, blank=True, verbose_name='STR#')
    ntn_number  = models.CharField(max_length=100, blank=True, verbose_name='NTN#')
    email       = models.EmailField(blank=True)
    website     = models.URLField(blank=True)
    city        = models.CharField(max_length=100, blank=True)
    province    = models.CharField(max_length=20, choices=PROVINCE_CHOICES, default='punjab', verbose_name='Province')
    tax_authority = models.CharField(max_length=10, choices=TAX_AUTHORITY_CHOICES, default='pra', verbose_name='Tax Authority')
    business_type = models.CharField(max_length=20, choices=[('goods','Goods'),('services','Services'),('both','Both Goods & Services')], default='services')
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Company Settings'
        verbose_name_plural = 'Company Settings'

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Auto-set tax authority from province
        if self.province:
            self.tax_authority = PROVINCE_TO_AUTHORITY.get(self.province, 'fbr')
        super().save(*args, **kwargs)
