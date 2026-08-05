from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('monitoring', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='monitor',
            name='last_check_message',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='monitor',
            name='last_check_status',
            field=models.CharField(blank=True, max_length=50),
        ),
    ]
