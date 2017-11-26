# -*- coding: utf-8 -*-
# Generated by Django 1.11.3 on 2017-11-01 10:33
from __future__ import unicode_literals

import django.contrib.postgres.fields.jsonb
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('workflow', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Action',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=256)),
                ('description_text', models.CharField(blank=True, default='', max_length=512)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('modified', models.DateTimeField(auto_now=True)),
                ('n_selected_rows', models.IntegerField(blank=True, verbose_name='Number of rows selected by filter')),
                ('content', models.TextField(blank=True, default='{% comment %} Your action content here{% endcomment %}')),
                ('serve_enabled', models.BooleanField(default=False, verbose_name='URL available to users?')),
                ('workflow', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='actions', to='workflow.Workflow')),
            ],
        ),
        migrations.CreateModel(
            name='Condition',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=256)),
                ('description_text', models.CharField(blank=True, default='', max_length=512)),
                ('formula', django.contrib.postgres.fields.jsonb.JSONField(blank=True, default=dict, null=True)),
                ('is_filter', models.BooleanField(default=False)),
                ('action', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='conditions', to='action.Action')),
            ],
        ),
        migrations.AlterUniqueTogether(
            name='condition',
            unique_together=set([('action', 'name', 'is_filter')]),
        ),
        migrations.AlterUniqueTogether(
            name='action',
            unique_together=set([('name', 'workflow')]),
        ),
    ]
