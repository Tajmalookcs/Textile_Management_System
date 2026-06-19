from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sales', '0004_invoice_fbr_fields'),
    ]

    operations = [
        # Customer — add province, city, ntn_verified
        migrations.AddField(
            model_name='customer',
            name='province',
            field=models.CharField(
                blank=True, default='punjab', max_length=20,
                choices=[('punjab','Punjab'),('sindh','Sindh'),('kpk','Khyber Pakhtunkhwa (KPK)'),('balochistan','Balochistan'),('federal','Federal / Islamabad'),('ajk','AJK'),('gb','Gilgit-Baltistan')],
                verbose_name='Province',
            ),
        ),
        migrations.AddField(
            model_name='customer',
            name='city',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='customer',
            name='ntn_verified',
            field=models.BooleanField(default=False, verbose_name='NTN Verified'),
        ),
        migrations.AlterField(
            model_name='customer',
            name='address',
            field=models.TextField(blank=True),
        ),
        migrations.AlterField(
            model_name='customer',
            name='phone',
            field=models.CharField(blank=True, max_length=100),
        ),
        # Invoice — add place_of_supply
        migrations.AddField(
            model_name='invoice',
            name='place_of_supply',
            field=models.CharField(
                default='punjab', max_length=20,
                choices=[('punjab','Punjab'),('sindh','Sindh'),('kpk','Khyber Pakhtunkhwa (KPK)'),('balochistan','Balochistan'),('federal','Federal / Islamabad'),('ajk','AJK'),('gb','Gilgit-Baltistan')],
                verbose_name='Place of Supply',
            ),
        ),
    ]
