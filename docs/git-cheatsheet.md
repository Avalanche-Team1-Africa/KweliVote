# KweliVote Git Branching Workflow Cheatsheet

This cheatsheet provides a guide for working with the KweliVote repository using a three-branch workflow: `main`, `dev`, and `test`.

## Branch Structure Overview

- **`main`**: Production branch. Contains stable, released code.
- **`dev`**: Development branch. Integration branch for features before moving to testing.
- **`test`**: Testing branch. For QA and testing before code is promoted to production.

## Basic Git Commands

```
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

### Working with the Dev Branch

```
# Switch to dev branch
git checkout dev

# Create a feature branch from dev
git checkout -b feature/your-feature-name dev

# Work on your feature...
# [Make changes, commits, etc.]

# Commit your changes
git add .
git commit -m "Descriptive commit message"

# Update your feature branch with latest dev changes
git checkout dev
git pull origin dev
git checkout feature/your-feature-name
git rebase dev

# Push feature branch to remote
git push origin feature/your-feature-name

# Create a pull request to merge into dev (through GitHub/GitLab interface)

# After PR approval, merge to dev
git checkout dev
git merge feature/your-feature-name
git push origin dev
```

### Working with the Test Branch

```
# Once dev is ready for testing, merge to test branch
git checkout test
git pull origin test
git merge dev
git push origin test
```

### Working with the Main Branch (Production)

```
# After testing is complete, merge to main for release
git checkout main
git pull origin main
git merge test
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

# Update the test branch too
git checkout test
git merge dev
git push origin test
```

### Resolving Merge Conflicts

```
# When conflicts occur during merge/rebase
# Edit the conflicted files manually
git add <resolved-files>
git commit  # For merge
git rebase --continue  # For rebase
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
3. **Keep feature branches short-lived**
4. **Regularly rebase feature branches with dev**
5. **Delete branches after they're merged**:
   ```
   git branch -d feature/your-feature-name
   git push origin --delete feature/your-feature-name
   ```
6. **Don't merge directly to main** - Always follow the dev → test → main pathway
7. **Use tags for releases** on the main branch

## Visual Workflow Diagram

```
main    o---o---o---o---o  (stable/production)
          \         /
test       o---o---o       (testing/QA)
            \     /
dev          o---o---o     (integration)
             /     \
feature1    o       \      (feature branches)
                     \
feature2              o
```

This workflow helps maintain code quality and stability while facilitating collaborative development.