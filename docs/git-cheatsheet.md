# KweliVote Git Branching Workflow Cheatsheet

This cheatsheet provides a guide for working with the KweliVote repository using a two-branch workflow: `main` and `dev`.

## Branch Structure Overview

- **`main`**: Production branch. Contains stable, released code.
- **`dev`**: Development branch. Used for both feature development and testing before moving to production.

## Basic Git Commands

```
# Setup two identical remote repos and make sure we push to both simultaneously
git remote set-url --add --push origin https://github.com/snjiraini/KweliVote.git
git remote set-url --add --push origin https://github.com/Avalanche-Team1-Africa/KweliVote.git
git push --force origin main

# Check the status of your working directory
git status

# View commit history
git log
git log --oneline --graph --decorate  # Prettier view

# List all branches
git branch -a
```

## Branch Workflow

### Initial Setup

```
# Clone the repository
git clone <repository-url>
git fetch --all
```

### Creating Dev Branch

You can create the dev branch either locally or on GitHub first. Here are both approaches:

#### Option 1: Creating Dev Branch Locally First

```
# Ensure you have the latest main branch
git checkout main
git pull origin main

# Create dev branch locally
git checkout -b dev
git push -u origin dev
```

#### Option 2: Creating Dev Branch on GitHub First

1. On GitHub, navigate to your repository
2. Click on the "main" branch dropdown
3. Enter "dev" in the search box and click "Create branch: dev from 'main'"
4. Then fetch the new branch locally:

```
# Fetch the remote branches
git fetch --all

# Checkout the dev branch locally
git checkout dev
```

#### Which Approach to Choose?

- **GitHub First**: Good when you need to set up branch protection rules or when you work from multiple computers.
- **Local First**: More convenient when you're already working locally and ready to start development.

### Working with the Dev Branch

```
# Switch to dev branch
git checkout dev

# Create a feature branch from dev (optional but recommended for larger features)
git checkout -b feature/your-feature-name dev

# Work on your feature...
# [Make changes, commits, etc.]

# Commit your changes
git add .
git commit -m "Descriptive commit message"

# If you used a feature branch, merge it back to dev when complete
git checkout dev
git merge feature/your-feature-name
git push origin dev

# Test your changes in the dev branch
# [Run tests, manually verify functionality]
```

### Working with the Main Branch (Production)

```
# After testing is complete on dev, merge to main for release
git checkout main
git pull origin main
git merge dev
git push origin main

# Tag the release
git tag -a v1.x.x -m "Version 1.x.x"
git push origin --tags
```

## Common Git Scenarios

### Fixing a Bug in Production

```
# Create a hotfix branch from main
git checkout -b hotfix/bug-description main

# Fix the bug, commit changes
git add .
git commit -m "Fix critical bug XYZ"

# Merge back to main
git checkout main
git merge hotfix/bug-description
git push origin main

# Also apply the fix to dev
git checkout dev
git merge hotfix/bug-description
git push origin dev
```

### Resolving Merge Conflicts

```
# When conflicts occur during merge/rebase
# Edit the conflicted files manually
git add <resolved-files>
git commit  # For merge
git rebase --continue  # For rebase

#Discard Local Changes, Take Incoming Branch (Hard Reset)
git checkout main
git reset --hard feature
git push --force origin main
```

### Undoing Changes

```
# Discard uncommitted changes
git restore <file>

# Undo last commit but keep changes staged
git reset --soft HEAD~1

# Undo last commit and discard changes
git reset --hard HEAD~1
```

## Best Practices

1. **Always pull before pushing**: `git pull origin <branch-name>`
2. **Create meaningful commit messages**
3. **For complex features, use feature branches off of dev**
4. **Test thoroughly in dev before merging to main**
5. **Delete feature branches after they're merged**:
   ```
   git branch -d feature/your-feature-name
   git push origin --delete feature/your-feature-name
   ```
6. **Use tags for releases** on the main branch

## Visual Workflow Diagram

```
main    o-----------o-----------o  (stable/production)
         \           \
dev       o---o---o---o---o---o    (development/testing)
              /           \
feature1     o             \       (optional feature branches)
                            \
feature2                     o
```

This simplified workflow maintains code stability while being practical for solo development.