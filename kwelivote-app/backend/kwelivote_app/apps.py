from django.apps import AppConfig


class KwelivoteAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'kwelivote_app'

    def ready(self):
        # Import signals to register them
        import kwelivote_app.signals