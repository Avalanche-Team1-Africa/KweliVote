# KweliVote - app frontend and backend creation

## Explain to GitHub Copilot the goals and steps

```text
I want to build a KweliVote app that will include the following:

* Home screen clearly showing login profiles as follows:
  - Registration Clerks
  - IEBC Constituency Election Coordinators (CECs)
  - Presiding Officer (PO)
  - Deputy Presiding Officer (DPO)
  - Polling Clerks

* User authentication and profiles
* Profile roles:
  - Registration Clerks:Can register  voters 
* Voting Results validation.
  - President
  - Member of National Assembly (MP)
  - Senator
  - County Woman Representative
  - Governor
  - Member of County Assembly (MCA)
  Clearly list candidates vying for each position, the political party, textbox to enter counted votes per candidate.


It should be in one app

generate instructions in this order

1. Create the frontend and backend in the kwelivote-app directory structure of this repository in one command
2. Setup backend python venv and create a kwelivote-app/backend/requirements.txt file
3. The kwelivote-app/backend directory will store the django project and app with the name kwelivote_app
4. The Django project kwelivote_app directory will have all the backend components for the app
5. Create the django app directly in the directory kwelivote_app/backend
6. Setup the kwelivote-app/frontend directory will store the react app with no subdirectories
7. Install react framework
8. Install bootstrap and import it
9. Commands to install mongodb via 'apt-get' 
10. Commands start mongodb with the 'sudo service mongodb start' and 'sudo service mongodb status'

The directory tree for the KweliVote App
kwelivote-app/
├── backend/
│   ├── venv/
│   ├── kwelivote_app/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── settings.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
└── frontend/
    ├── node_modules/
    ├── public/
    ├── src/
    ├── package.json
    └── README.md

Create a requirements.txt with the following Python required packages

Django==4.1
djangorestframework==3.14.0
django-allauth==0.51.0
django-cors-headers==4.5.0
dj-rest-auth
djongo==1.3.6
pymongo==3.12
sqlparse==0.2.4
stack-data==0.6.3
sympy==1.12
tenacity==9.0.0
terminado==0.18.1
threadpoolctl==3.5.0
tinycss2==1.3.0
tornado==6.4.1
traitlets==5.14.3
types-python-dateutil==2.9.0.20240906
typing_extensions==4.9.0
tzdata==2024.2
uri-template==1.3.0
urllib3==2.2.3
wcwidth==0.2.13
webcolors==24.8.0
webencodings==0.5.1
websocket-client==1.8.0

All of the backend django app will be in kwelivote-app and do NOT create another app of any kind

Use a Python virtual environment and install all python dependencies from file kwelivote-app/backend/requirements.txt in this workspace

The kwelivote-app/backend/requirements.txt already contains all Django requirements. Django, djongo, sqlparse

Layout the directory structure with no redundant backend and frontend subdirectories

Use bootstrap for the frontend

Let's think about this step by step
```

### Commands to use to create the kwelivote-app structure

```bash
mkdir -p kwelivote-app/{backend,frontend}

python3 -m venv kwelivote-app/backend/venv
source kwelivote-app/backend/venv/bin/activate
pip install -r kwelivote-app/backend/requirements.txt

django-admin startproject kwelivote_app kwelivote-app/backend

npx create-react-app kwelivote-app/frontend

npm install bootstrap kwelivote-app/frontend

echo "import 'bootstrap/dist/css/bootstrap.min.css';" >> src/index.js

sudo apt-get update && sudo apt-get install -y mongodb
sudo service mongodb start && sudo service mongodb status
```

## Initialize the database, setup database and install apps in settings.py, models, serializers, urls, and views

Type the following prompt in GitHub Copilot Chat:

```text
In our next steps lets think step by step and setup the following in this order

1. Initialize the mongo kwelivote_db database and create a correct table structure for users, voters, keypersons, candidates, and resultscount. Users will be linked to keypersons, but not all key persons will have users, example, observers will have no system access, but registration clerks will also be a user
2. Make sure there is a unique id for primary key for the user collection 
   ex. db.users.createIndex({ "nationalid": 1 }, { unique: true })
3. settings.py in our django project for mongodb kwelivote_db database including localhost and the port
4. settings.py in our django project setup for all installed apps. ex djongo, kwelivote_app, rest_framework
5. In kwelivote_app project setup and use command touch models.py, serializers.py, urls.py, and views.py for users, voters, keypersons, candidates, and resultscount
6. Generate code for models.py, serializers.py, and views.py and
7. make sure urls.py has a root, admin, and api endpoints
    urlpatterns = [
        path('', api_root, name='api-root'),  # Root endpoint
        path('admin/', admin.site.urls),  # Admin endpoint
        path('api/', include(router.urls)),  # API endpoint
    ]
```

### MongoDB commands to initialize and setup `kwelivote_db`

```bash
users, voters, keypersons, candidates, and resultscount
mongo --eval "db = db.getSiblingDB('kwelivote_db'); db.createCollection('users'); db.createCollection('voters'); db.createCollection('keypersons'); db.createCollection('candidates'); db.createCollection
('resultscount'); db.users.createIndex({ nationalid: 1 }, { unique: true }); db.voters.createIndex({ nationalid: 1 }, { unique: true }); db.keypersons.createIndex({ nationalid: 1 }, { unique: true }); db.candidates.createIndex({ nationalid: 1 }, { unique: true }); db.resultscount.createIndex({ resultscount_id: 1 }, { unique: true });"
```

### Check the database collections

```bash
mongo --eval "db = db.getSiblingDB('kwelivote_db'); printjson(db.getCollectionNames());"
```

### Sample settings.py

```json
# FILE: kwelivote_app/settings.py

"""
Django settings for kwelivote_app project.

Generated by 'django-admin startproject' using Django 4.1.

For more information on this file, see
https://docs.djangoproject.com/en/4.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/4.1/ref/settings/
"""

from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = "django-insecure-25rsll_s*6ml5lv4l$51z6x!y5u_k!11f!hf^1&%q!$syk=ja3"

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'congenial-robot-pwrx4jxpp9c6vjv-8000.app.github.dev']


# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    'rest_framework',
    'djongo',
    'corsheaders',
    'kwelivote_app',
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    'corsheaders.middleware.CorsMiddleware',
]

ROOT_URLCONF = "kwelivote_app.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "kwelivote_app.wsgi.application"


# Database
# https://docs.djangoproject.com/en/4.1/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'djongo',
        'NAME': 'kwelivote_db',
        'HOST': 'localhost',
        'PORT': 27017,
    }
}


# Password validation
# https://docs.djangoproject.com/en/4.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
# https://docs.djangoproject.com/en/4.1/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.1/howto/static-files/

STATIC_URL = "static/"

# Default primary key field type
# https://docs.djangoproject.com/en/4.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CORS_ALLOW_ALL_ORIGINS = True
```

### Sample code for models.py, serializers.py, views.py, and urls.py

#### models.py

```python
# FILE: kwelivote-app/backend/kwelivote-app/models.py

from djongo import models
from django.utils import timezone

# ------------------------
# KeyPersons Collection
# ------------------------
class KeyPerson(models.Model):
    nationalid = models.CharField(primary_key=True, max_length=20)
    
    ROLE_CHOICES = [
        ("Registration Clerk", "Registration Clerk"),
        ("IEBC Constituency Election Coordinators (CECs)", "IEBC Constituency Election Coordinators (CECs)"),
        ("Polling Clerks", "Polling Clerks"),
        ("Party Agents", "Party Agents"),
        ("Observers", "Observers"),
        ("Presiding Officer (PO)", "Presiding Officer (PO)"),
        ("Deputy Presiding Officer (DPO)", "Deputy Presiding Officer (DPO)"),
    ]
    role = models.CharField(max_length=100, choices=ROLE_CHOICES)
    
    did = models.CharField(max_length=255)
    political_party = models.CharField(max_length=100, blank=True, null=True)
    designated_polling_station = models.CharField(max_length=100)

    OBSERVER_TYPE_CHOICES = [
        ("local", "Local"),
        ("international", "International")
    ]
    observer_type = models.CharField(max_length=20, choices=OBSERVER_TYPE_CHOICES, blank=True, null=True)
    
    stakeholder = models.CharField(max_length=255, blank=True, null=True, help_text="Name of country or organization")
    created_by = models.CharField(max_length=100)
    created_datetime = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.role} - {self.nationalid}"


# ------------------------
# Users Collection
# ------------------------
class User(models.Model):
    username = models.CharField(max_length=100)
    nationalid = models.ForeignKey(KeyPerson, on_delete=models.CASCADE)
    password = models.CharField(max_length=100)

    def __str__(self):
        return self.username


# ------------------------
# Voters Collection
# ------------------------
class Voter(models.Model):
    firstname = models.CharField(max_length=100)
    middlename = models.CharField(max_length=100, blank=True, null=True)
    surname = models.CharField(max_length=100)
    nationalid = models.CharField(primary_key=True, max_length=20)
    did = models.CharField(max_length=255)
    designated_polling_station = models.CharField(max_length=100)
    created_by = models.CharField(max_length=100)
    created_datetime = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.firstname} {self.surname}"


# ------------------------
# Candidates Collection
# ------------------------
class Candidate(models.Model):
    firstname = models.CharField(max_length=100)
    middlename = models.CharField(max_length=100, blank=True, null=True)
    surname = models.CharField(max_length=100)
    nationalid = models.CharField(max_length=20, unique=True)
    did = models.CharField(max_length=255)

    CANDIDATE_TYPE_CHOICES = [
        ("President", "President"),
        ("Member of National Assembly (MP)", "Member of National Assembly (MP)"),
        ("Senator", "Senator"),
        ("County Woman Representative", "County Woman Representative"),
        ("Governor", "Governor"),
        ("Member of County Assembly (MCA)", "Member of County Assembly (MCA)")
    ]
    candidate_type = models.CharField(max_length=50, choices=CANDIDATE_TYPE_CHOICES)
    created_by = models.CharField(max_length=100)
    created_datetime = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.candidate_type}: {self.firstname} {self.surname}"

```

#### serializers.py

```python
from bson import ObjectId
from rest_framework import serializers
from .models import User, Voter, KeyPerson, Candidate

class KeyPersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = KeyPerson
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'

class VoterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Voter
        fields = '__all__'

class CandidateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Candidate
        fields = '__all__'

```

#### views.py

```python
# FILE: kwelivote-app/backend/kwelivote_app/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.reverse import reverse
from .models import User, Voter, KeyPerson, Candidate
from .serializers import UserSerializer, VoterSerializer, KeyPersonSerializer, CandidateSerializer

@api_view(['GET', 'POST'])
def api_root(request, format=None):
    if request.method == 'POST':
        return Response({"message": "POST request received"}, status=status.HTTP_201_CREATED)

    base_url = '[USE CODESPACE URL]'
    return Response({
        'users': base_url + 'api/users/?format=api',
        'voters': base_url + 'api/voters/?format=api',
        'keypersons': base_url + 'api/keypersons/?format=api',
        'candidates': base_url + 'api/candidates/?format=api'
    })

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class VoterViewSet(viewsets.ModelViewSet):
    queryset = Voter.objects.all()
    serializer_class = VoterSerializer

class KeyPersonViewSet(viewsets.ModelViewSet):
    queryset = KeyPerson.objects.all()
    serializer_class = KeyPersonSerializer

class CandidateViewSet(viewsets.ModelViewSet):
    queryset = Candidate.objects.all()
    serializer_class = CandidateSerializer
```

#### urls.py

```python
# FILE: kwelivote-app/backend/kwelivote_app/urls.py

from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, VoterViewSet, KeyPersonViewSet, CandidateViewSet, api_root

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'voters', VoterViewSet)
router.register(r'keypersons', KeyPersonViewSet)
router.register(r'candidates', CandidateViewSet)

urlpatterns = [
    path('', api_root, name='api-root'),  # Root endpoint
    path('admin/', admin.site.urls),  # Admin endpoint
    path('api/', include(router.urls)),  # API endpoint
]
```

## Populate the databse with sample data

```text
Let's use manage.py to get the database setup and populated based on fields in models.py

- Create populate_db.py as a manage.py command so it initializes and deletes previous data and recreates it
- populate_db.py User, Voter, KeyPerson, Candidate
- users will be super hero users
- Include steps to migrate in the kwelivote_app project
```

### Commands to create the directory structure for populate_db.py

```bash
mkdir -p kwelivote-app/backend/kwelivote_app/management/commands
touch kwelivote-app/backend/kwelivote_app/management/__init__.py
touch kwelivote-app/backend/kwelivote_app/management/commands/__init__.py
touch kwelivote-app/backend/kwelivote_app/management/commands/populate_db.py
```

### Sample code for populate_db.py to populate the database

Sample data use for populate_db.py
Should reside under kwelivote-app/backend/kwelivote_app/management/commands/populate_db.py

```python
# FILE: kwelivote-app/backend/kwelivote_app/management/commands/populate_db.py

from django.core.management.base import BaseCommand
from kwelivote_app.models import User, Voter, KeyPerson, Candidate
from django.conf import settings
from pymongo import MongoClient
from datetime import timedelta
from bson import ObjectId
from django.utils import timezone

class Command(BaseCommand):
    help = 'Populate the database with test data for User, Voter, KeyPerson, Candidate'

    def handle(self, *args, **kwargs):
        # Connect to MongoDB
        client = MongoClient(settings.DATABASES['default']['HOST'], settings.DATABASES['default']['PORT'])
        db = client[settings.DATABASES['default']['NAME']]

        # Drop existing collections
        db.users.drop()
        db.voters.drop()
        db.keypersons.drop()
        db.candidates.drop()

       
      #First create keypersons. This will allow linking this to users
      keypersons = [
          KeyPerson(
              nationalid='100001',
              role='Registration Clerk',
              did='did:example:100001',
              political_party='Independent',
              designated_polling_station='Station A',
              observer_type='local',
              stakeholder='Local Observer Org',
              created_by='admin',
              created_datetime=timezone.now()
          ),
          KeyPerson(
              nationalid='100002',
              role='Presiding Officer (PO)',
              did='did:example:100002',
              political_party='Party A',
              designated_polling_station='Station B',
              observer_type='international',
              stakeholder='UN',
              created_by='admin',
              created_datetime=timezone.now()
          ),
          KeyPerson(
              nationalid='100003',
              role='Deputy Presiding Officer (DPO)',
              did='did:example:100003',
              political_party='Party B',
              designated_polling_station='Station C',
              observer_type=None,
              stakeholder=None,
              created_by='admin',
              created_datetime=timezone.now()
          ),
          KeyPerson(
              nationalid='100004',
              role='Polling Clerks',
              did='did:example:100004',
              political_party='Party C',
              designated_polling_station='Station D',
              observer_type='local',
              stakeholder='Local Org',
              created_by='admin',
              created_datetime=timezone.now()
          ),
          KeyPerson(
              nationalid='100005',
              role='Observers',
              did='did:example:100005',
              political_party='Independent',
              designated_polling_station='Station E',
              observer_type='international',
              stakeholder='EU',
              created_by='admin',
              created_datetime=timezone.now()
          ),
      ]

      KeyPerson.objects.bulk_create(keypersons)


              # Create users
              # Get related KeyPersons
      kp1 = KeyPerson.objects.get(nationalid='100001')
      kp2 = KeyPerson.objects.get(nationalid='100002')
      kp3 = KeyPerson.objects.get(nationalid='100003')
      kp4 = KeyPerson.objects.get(nationalid='100004')
      kp5 = KeyPerson.objects.get(nationalid='100005')

      # Create User instances
      users = [
          User(username='thundergod', nationalid=kp1, password='thundergodpassword'),
          User(username='metalgeek', nationalid=kp2, password='metalgeekpassword'),
          User(username='zerocool', nationalid=kp3, password='zerocoolpassword'),
          User(username='crashoverride', nationalid=kp4, password='crashoverridepassword'),
          User(username='sleeptoken', nationalid=kp5, password='sleeptokenpassword'),
      ]

        # Create Voters
        voters = [
            Voter(firstname='Alice', middlename='L', surname='Johnson', nationalid='V1001', did='did:example:V1001',
                  designated_polling_station='Station A', created_by='admin', created_datetime=timezone.now()),

            Voter(firstname='Bob', middlename='M', surname='Smith', nationalid='V1002', did='did:example:V1002',
                  designated_polling_station='Station B', created_by='admin', created_datetime=timezone.now()),

            Voter(firstname='Charlie', middlename='N', surname='Ngugi', nationalid='V1003', did='did:example:V1003',
                  designated_polling_station='Station C', created_by='admin', created_datetime=timezone.now()),
        ]

        Voter.objects.bulk_create(voters)

        # Create Candidates
        candidates = [
        Candidate(firstname='Diana', middlename='O', surname='Kenya', nationalid='C1001', did='did:example:C1001',
                  candidate_type='President', created_by='admin', created_datetime=timezone.now()),

        Candidate(firstname='Eli', middlename='P', surname='Wanjiku', nationalid='C1002', did='did:example:C1002',
                  candidate_type='Governor', created_by='admin', created_datetime=timezone.now()),

        Candidate(firstname='Faith', middlename='Q', surname='Omari', nationalid='C1003', did='did:example:C1003',
                  candidate_type='Member of National Assembly (MP)', created_by='admin', created_datetime=timezone.now()),
    ]

    Candidate.objects.bulk_create(candidates)

        

        self.stdout.write(self.style.SUCCESS('Successfully populated the database with test data.'))
```

### Run the following commands to migrate the database and populate it with data

```bash
python kwelivote-app/backend/manage.py kwelivote-app/backend/makemigrations
python kwelivote-app/backend/manage.py kwelivote-app/backend/migrate
python kwelivote-app/backendmanage.py kwelivote-app/backend/populate_db
```

## Run the server via manage.py

```bash
python manage.py runserver
```

## Setup the frontend React app use the below package.json

```bash
mkdir -p kwelivote-app/frontend

npx create-react-app kwelivote-app/frontend

npm install bootstrap --prefix kwelivote-app/frontend

echo "import 'bootstrap/dist/css/bootstrap.min.css';" >> src/index.js

npm install react-router-dom --prefix kwelivote-app/frontend
```

### package.json

```json
{
  "name": "kwelivote-app",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@testing-library/dom": "^9.3.1",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/react": "^14.1.2",
    "@testing-library/user-event": "^14.5.1",
    "bootstrap": "^5.3.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "react-scripts": "5.0.1",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
```

## kwelivote App components

Create the following components

- Users
- Keypersons
- Candidates
- Voters
- Home

Basic username password authentication is fine

### App.js

```javascript
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Activities from './components/Activities';
import Leaderboard from './components/Leaderboard';
import Teams from './components/Teams';
import Users from './components/Users';
import Workouts from './components/Workouts';
import './App.css';

function App() {
  return (
    <Router>
      <div className="container">
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
          <div className="container-fluid">
            <Link className="navbar-brand" to="/">kwelivote app</Link>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav">
                <li className="nav-item">
                  <Link className="nav-link" to="/activities">Activities</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/leaderboard">Leaderboard</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/teams">Teams</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/users">Users</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/workouts">Workouts</Link>
                </li>
              </ul>
            </div>
          </div>
        </nav>
        <div className="mt-4">
          <Routes>
            <Route path="/activities" element={<Activities />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/users" element={<Users />} />
            <Route path="/workouts" element={<Workouts />} />
            <Route path="/" element={<h1>Welcome to kwelivote app</h1>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
```

### index.js potential React version issues

The error indicates that the ReactDOM.render function is not available in the version of React you are using. This is because React 18 introduced a new root API for rendering.

To fix this issue, update your src/index.js file to use the new createRoot API provided by React 18. Here's the updated code:

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client'; // Use the new root API
import './index.css';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';

const root = ReactDOM.createRoot(document.getElementById('root')); // Create a root
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Example leaderboard component

Always use the Codespace URL for the API endpoint

```javascript
import React, { useEffect, useState } from 'react';

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    fetch('https://congenial-robot-pwrx4jxpp9c6vjv-8000.app.github.dev/api/leaderboard/')
      .then(response => response.json())
      .then(data => setLeaderboard(data))
      .catch(error => console.error('Error fetching leaderboard:', error));
  }, []);

  return (
    <div>
      <h1>Leaderboard</h1>
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map(entry => (
            <tr key={entry._id}>
              <td>{entry.user.username}</td>
              <td>{entry.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Leaderboard;
```

## App.css example

```css
/* General styles */
body {
  font-family: 'Roboto', sans-serif;
  background-color: #f0f8ff; /* Light blue background */
  margin: 0;
  padding: 0;
}

.App {
  text-align: center;
}

/* Navigation styles */
nav {
  background-color: #4682b4; /* Steel blue */
  padding: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  justify-content: center;
}

nav ul li {
  margin: 0 1rem;
}

nav ul li a {
  color: #0f0be4; /* White text for visibility */
  text-decoration: none;
  font-weight: bold;
  font-size: 1.2rem;
  transition: color 0.3s;
}

nav ul li a:hover {
  color: #f0f8ff; /* Light blue */
  text-decoration: underline;
}

/* Component styles */
h1 {
  color: #00008b; /* Dark blue header name */
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

/* Table styles */
table {
  width: 90%;
  margin: 1rem auto;
  border-collapse: collapse;
  background-color: #ffffff; /* White background */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

table th, table td {
  border: 1px solid #ddd;
  padding: 1rem;
  text-align: left;
  font-size: 1rem;
}

table th {
  background-color: #4682b4; /* Steel blue */
  color: white;
  font-size: 1.2rem;
}

table tr:nth-child(even) {
  background-color: #f0f8ff; /* Light blue */
}

table tr:hover {
  background-color: #e0ffff; /* Light cyan */
}

ul {
  list-style: none;
  padding: 0;
}

ul li {
  color: #4682b4; /* Steel blue text */
  background-color: #fff;
  margin: 0.5rem 0;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-size: 1.1rem;
}

/* Text styles */
.component-text {
  color: #00008b; /* Dark blue center title */
  font-size: 1.8rem;
  margin-bottom: 1rem;
}

/* Button styles */
button {
  background-color: #4682b4; /* Steel blue */
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #5a9bd4; /* Lighter steel blue */
}

.App-logo {
  height: 40vmin;
  pointer-events: none;
}

@media (prefers-reduced-motion: no-preference) {
  .App-logo {
    animation: App-logo-spin infinite 20s linear;
  }
}

.App-header {
  background-color: #2b2834;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
  color: white;
}

.App-link {
  color: #61dafb;
}

@keyframes App-logo-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
```
