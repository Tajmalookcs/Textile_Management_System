from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='companysettings',
            name='province',
            field=models.CharField(
                choices=[('punjab','Punjab'),('sindh','Sindh'),('kpk','Khyber Pakhtunkhwa (KPK)'),('balochistan','Balochistan'),('federal','Federal / Islamabad'),('ajk','AJK'),('gb','Gilgit-Baltistan')],
                default='punjab', max_length=20, verbose_name='Province',
            ),
        ),
        migrations.AddField(
            model_name='companysettings',
            name='tax_authority',
            field=models.CharField(
                choices=[('fbr','FBR (Federal Board of Revenue)'),('pra','PRA (Punjab Revenue Authority)'),('srb','SRB (Sindh Revenue Board)'),('kpra','KPRA (KPK Revenue Authority)'),('bra','BRA (Balochistan Revenue Authority)')],
                default='pra', max_length=10, verbose_name='Tax Authority',
            ),
        ),
        migrations.AddField(
            model_name='companysettings',
            name='business_type',
            field=models.CharField(
                choices=[('goods','Goods'),('services','Services'),('both','Both Goods & Services')],
                default='services', max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name='companysettings',
            name='address',
            field=models.TextField(blank=True),
        ),
        migrations.AlterField(
            model_name='companysettings',
            name='phone',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AlterField(
            model_name='companysettings',
            name='str_number',
            field=models.CharField(blank=True, max_length=100, verbose_name='STR#'),
        ),
        migrations.AlterField(
            model_name='companysettings',
            name='ntn_number',
            field=models.CharField(blank=True, max_length=100, verbose_name='NTN#'),
        ),
        migrations.AlterField(
            model_name='companysettings',
            name='city',
            field=models.CharField(blank=True, max_length=100),
        ),
    ]
