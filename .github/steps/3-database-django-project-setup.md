## Step 3: Initialize and create the kwelivote_db MongoDB database, Django project/app, update Django project/app files, and populate the MongoDB database

In this step, we will accomplish the following:

- Set up the kwelivote_db MongoDB database structure.
- Update the kwelivote-app/backend/kwelivote_app app files:
  - settings, models, serializers, urls, views, tests, and admin files.
- Populate the kwelivote_db database with test data.
- Verify the test data is populated in the kwelivote_db database.

1. Open all files in the `docs` folder and keep this file open in the editor throughout this exercise.
    1.  agent mode uses `docs/Burundi_voter_identity_management.md` and `docs/Burundi_Elections_story.md` as a reference to create the application
2. Copy and paste the following prompt(s) in the GitHub Copilot Chat and select the "Agent" instead of "Ask" or "Edit" from the drop down where you are inserting the prompt.

> 🪧 **Note:** 
- Do not change the model from GPT-4o this will be an optional activity at the end of the course.
- Keep in mind that the Copilot agent mode is conversational so it may ask you questions and you can ask it questions too.
- Wait a moment for the Copilot to respond and press the `Continue` button to execute commands presented by Copilot agent mode.
- Keep files created and updated by Copilot agent mode until it is finished.
- Agent mode has the ability to evaluate your code base and execute commands and add/refactor/delete parts of your code base and automatically self heal if it or you makes a mistake in the process.

### :keyboard: Activity: Setup the Python Django project/app

> ![Static Badge](https://img.shields.io/badge/-Prompt-text?style=flat-square&logo=github%20copilot&labelColor=512a97&color=ecd8ff)
>
> ```prompt
> Based on the example kwelivote app app in the docs/Burundi_voter_identity_management.md file and use kwelivote as the name for app,  > let's setup the Python Django project/app and run the server.
>
> 1. The kwelivote-app/backend directory will store the django project and app with the name kwelivote-app.
> 2. Setup the additional configuration for the django project/app with the name kwelivote-app.
>
> Don't proceed with the next activity until all of these steps are completed.
>```

> 🪧 **Note:** 
- Wait a moment for the Copilot to respond and press the `Continue` button to execute each command presented by Copilot agent mode.
- Keep files created and updated until the Copilot agent mode has finished.

> ❕ **Important:**
- Don't start the Python Django app in the way that GitHub Copilot agent mode suggests hit **cancel**.

### :keyboard: Activity: Initialize and create the kwelivote_db MongoDB database

> ![Static Badge](https://img.shields.io/badge/-Prompt-text?style=flat-square&logo=github%20copilot&labelColor=512a97&color=ecd8ff)
>
> ```prompt
> Based on the example kwelivote app app in the docs/mona-high-school-fitness-app.md file and use kwelivote as the name for Merington's high school's app. Let's initialize the kwelivote_db database.
>
> 1. Initialize the mongo kwelivote_db database.
> 2. Create a correct table structure for users, teams, activity, leaderboard, and workouts collections.
> 3. Make sure there is a unique ID for the primary key for the user collection.
>   ex. db.users.createIndex({ "email": 1 }, { unique: true })
> 4. Execute the command for me to create the database.
> 5. List the collections in the kwelivote_db database.
> 
> Don't proceed with the next activity until all of these steps are completed.
> ```

> ❕ **Important:**
- If there is no `Continue` button, just pull the left side of the GitHub Copilot Chat panel over to the left, and it should appear.
- If this doesn't work, you may need to copy and paste the response in the terminal if there is no `Continue` button.

### :keyboard: Activity: Update the Python Django project/app files

> ![Static Badge](https://img.shields.io/badge/-Prompt-text?style=flat-square&logo=github%20copilot&labelColor=512a97&color=ecd8ff)
>
> ```prompt
> Based on the example kwelivote app app in the docs/mona-high-school-fitness-app.md file and use kwelivote as the name for Merington's high school's app. Let's update the kwelivote-app/backend/kwelivote_app app files.
>
> 1. Update the kwelivote-app/backend/kwelivote_app/settings.py file to include the MongoDB database connection.
> 2. Update the kwelivote-app/backend/kwelivote_app/models.py file to include the models for users, teams, activity, leaderboard, and workouts collections.
> 3. Update the kwelivote-app/backend/kwelivote_app/serializers.py file to include the serializers for users, teams, activity, leaderboard, and workouts collections.
> 4. Update the kwelivote-app/backend/kwelivote_app/urls.py file to include the URLs for users, teams, activity, leaderboard, and workouts collections.
> 5. Update the kwelivote-app/backend/kwelivote_app/views.py file to include the views for users, teams, activity, leaderboard, and workouts collections.
> 6. Update the kwelivote-app/backend/kwelivote_app/tests.py file to include the tests for users, teams, activity, leaderboard, and workouts collections.
> 7. Update the kwelivote-app/backend/kwelivote_app/admin.py file to include the admin for users, teams, activity, leaderboard, and workouts collections.
> 8. Make sure api_root is in kwelivote-app/backend/kwelivote_app/urls.py
> 9. Enable CORS in the kwelivote-app/backend/kwelivote_app/settings.py file to allow cross-origin requests from the frontend React app and allow all origins, methods, and headers.
> 10. Allow all hosts in the settings.py file.
> 11. Install CORS middleware components.
>
> Don't proceed with the next activity until all of these steps are completed.
> ```

> ❕ **Important:** Don't start the Python Django app in the way that GitHub Copilot agent mode suggests hit **cancel**.

### :keyboard: Activity: Populate the kwelivote_db database with test data from Django project/app files

> ![Static Badge](https://img.shields.io/badge/-Prompt-text?style=flat-square&logo=github%20copilot&labelColor=512a97&color=ecd8ff)
>
> ```prompt
> Based on the example kwelivote app app in the docs/mona-high-school-fitness-app.md file and use kwelivote as the name for Merington's high school's app. Let's populate the kwelivote_db database with test data. Use the same data from docs/mona-high-school-fitness-app.md file.
> 
> 1. Create a test data file in the kwelivote-app/backend/kwelivote_app directory.
> 2. Run makemigrations and migrate the database in a Python virtual environment.
> 3. Populate the kwelivote_db database with test data for users, teams, activities, leaderboard, and workouts collections based on test data in docs/mona-high-school-fitness-app.md kwelivote-app/backend/kwelivote_app/management/commands/populate_db.py.
> 4. Verify the test data is populated in the kwelivote_db database.
> 
> Don't proceed with the next activity until all of these steps are completed.
> ```

> ❕ **Important:**
- Don't start the Python Django app in the way that GitHub Copilot agent mode suggests hit **cancel**.
- If there is no `Continue` button, just pull the left side of the GitHub Copilot Chat panel over to the left, and it should appear.
- If this doesn't work, you may need to copy and paste the response in the terminal if there is no `Continue` button.

1. Now that we have created the database structure, updated our Django project files, and populated the database, let's check our changes into our `build-kwelivote-app` branch.

1. With our new changes complete, please **commit** and **push** the changes to GitHub.

1. Wait a moment for Mona to check your work, provide feedback, and share the next lesson so we can keep working!

<details>
<summary>Having trouble? 🤷</summary><br/>

If you don't get feedback, here are some things to check:

- Make sure your commit changes were made for the following files to the branch `build-kwelivote-app` and pushed/synchronized to GitHub:
  - `kwelivote-app/backend/kwelivote_app/settings.py`
  - `kwelivote-app/backend/kwelivote_app/management/commands/populate_db.py`
- If Mona found a mistake, simply make a correction and push your changes again. Mona will check your work as many times as needed.

</details>
