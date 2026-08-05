from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('search', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='searchresult',
            name='source',
            field=models.CharField(choices=[('dehashed', 'Dehashed'), ('hibp', 'Have I Been Pwned'), ('intelx', 'Intelligence X'), ('internal', 'Internal')], default='dehashed', max_length=20),
        ),
    ]
