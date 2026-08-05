from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reports', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='report',
            name='artifact_content',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='report',
            name='artifact_format',
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name='report',
            name='generated_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
