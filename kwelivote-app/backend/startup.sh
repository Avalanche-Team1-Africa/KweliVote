#!/bin/bash

# Navigate to the app directory
cd /home/site/wwwroot/

echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "Applying database migrations..."
python manage.py migrate --settings=kwelivote_app.production_settings

echo "Collecting static files..."
python manage.py collectstatic --noinput --settings=kwelivote_app.production_settings

echo "Starting Gunicorn server..."
gunicorn kwelivote_app.wsgi:application \
    --bind=0.0.0.0:8000 \
    --timeout 600 \
    --workers 2 \
    --env DJANGO_SETTINGS_MODULE=kwelivote_app.production_settings
