from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sales', '0003_nullable_invoice_item_product'),
    ]

    operations = [
        migrations.AddField(
            model_name='invoice',
            name='fbr_status',
            field=models.CharField(
                choices=[('pending','Pending'),('submitted','Submitted'),('accepted','Accepted'),('rejected','Rejected'),('error','Error')],
                default='pending', max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='invoice',
            name='fbr_irn',
            field=models.CharField(blank=True, max_length=200, verbose_name='FBR Invoice Reference Number'),
        ),
        migrations.AddField(
            model_name='invoice',
            name='fbr_qr_code',
            field=models.URLField(blank=True, max_length=500, verbose_name='FBR QR Code URL'),
        ),
        migrations.AddField(
            model_name='invoice',
            name='fbr_submitted_at',
            field=models.DateTimeField(null=True, blank=True, verbose_name='FBR Submission Time'),
        ),
        migrations.AddField(
            model_name='invoice',
            name='fbr_error',
            field=models.TextField(blank=True, verbose_name='FBR Error Message'),
        ),
    ]
