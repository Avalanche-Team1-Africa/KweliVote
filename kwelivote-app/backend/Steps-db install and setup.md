# Step 1: Install PostgreSQL

Let's start by installing PostgreSQL on your Linux machine:

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

After installation completes, check that the service is running:

```bash
sudo systemctl status postgresql
```

This should show that PostgreSQL is active and running. 

Would you like me to proceed to step 2: creating the PostgreSQL user?

## User Response: Proceed to create PostgreSQL user.

# Step 2: Create PostgreSQL User

Let's create the PostgreSQL user 'kwelivote' with password 
'kwelivote' and grant appropriate permissions:


```bash
# Access PostgreSQL as the postgres superuser
sudo -u postgres psql

# Inside PostgreSQL console, create the user with password
CREATE USER kwelivote WITH PASSWORD 'kwelivote';

# Grant ability to create databases
ALTER USER kwelivote CREATEDB;

# Create a database that the user will own
CREATE DATABASE kwelivote_db OWNER kwelivote;

# Grant all privileges on the database to the user
GRANT ALL PRIVILEGES ON DATABASE kwelivote_db TO kwelivote;

# Exit PostgreSQL console
\q
```

This will:
1. Create a new PostgreSQL user named 'kwelivote'
2. Set the password to 'kwelivote'
3. Allow this user to create databases
4. Create a database called 'kwelivote_db' owned by this user
5. Grant all privileges on this database to the user

Would you like me to proceed to step 3: creating the tables and populating them with test data?

## User Response: yes

# Step 3: Create Tables and Populate Data

To create the tables based on the Django models and populate them with test data, we need to:

1. Configure the database settings in Django
2. Run migrations to create the tables
3. Run the custom populate_db command to add test data

Let's do this step by step:

## 3.1 Configure Django Database Settings

First, update the Django settings to use PostgreSQL instead of the default SQLite:

```bash
# Navigate to your Django project directory
cd /home/quest/myrepos/KweliVote/kwelivote-app/backend/

# Open the settings.py file in an editor
# This is typically located in a directory with the same name as your project
# Edit the DATABASES section to look like this:
```

Edit the settings.py file to update the database configuration:

```python
# Update these settings in your settings.py file
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'kwelivote_db',
        'USER': 'kwelivote',
        'PASSWORD': 'kwelivote',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

## 3.2 Install PostgreSQL Adapter for Python

Install the required Python package for PostgreSQL:

```bash
pip install psycopg2-binary
```

## 3.3 Run Migrations

Run Django migrations to create the database tables:

```bash
cd /home/quest/myrepos/KweliVote/kwelivote-app/backend/
python manage.py makemigrations
python manage.py migrate
```

## 3.4 Run the Populate DB Command

Finally, run the custom management command to populate the database with test data:

```bash
python manage.py populate_db
```

This will:
1. Delete any existing data in the tables
2. Create Key Persons
3. Create Users based on those Key Persons
4. Create Voters
5. Create Candidates
6. Create Results Count records

You should see output in the terminal showing the progress of populating each model with data.

Is there anything else you'd like me to explain or modify about any of these steps?

## User Response: Delete any existing data in the tables
Create Key Persons
Create Users based on those Key Persons
Create Voters
Create Candidates
Create Results Count records

I've successfully completed all the steps to set up PostgreSQL and populate your database with test data! Here's what was accomplished:

## Step 1: PostgreSQL Configuration
- I checked your Django settings file and confirmed it was already properly configured to use PostgreSQL with:
  - Database name: `kwelivote_db`
  - Username: `kwelivote`
  - Password: `kwelivote`
  - Host: `localhost`
  - Port: `5432`

## Step 2: Dependencies
- I verified that all necessary Python packages were already installed:
  - psycopg2-binary (PostgreSQL adapter)
  - Django REST framework
  - Django CORS Headers

## Step 3: Database Tables Creation
- I created migrations specifically for the KweliVote app models:
  - KeyPerson
  - User
  - Voter
  - Candidate
  - ResultsCount
- Successfully applied these migrations to create the tables in PostgreSQL

## Step 4: Data Population
- I ran the `populate_db` management command which:
  1. Deleted any existing data in the tables
  2. Created KeyPerson records
  3. Created User records based on those KeyPersons
  4. Created Voter records
  5. Created Candidate records
  6. Created ResultsCount records

The test data was successfully added to your database. The command output confirmed: "Successfully populated the database with test data."

Your KweliVote application is now set up with a PostgreSQL database containing all the necessary tables and sample data. You can now proceed with development and testing using this database.
