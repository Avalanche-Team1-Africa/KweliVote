## Chat Export (Markdown)

**User:**  
How do I connect to postgres database cli, check databases and run select statements

**Assistant:**  
To connect to a PostgreSQL database using the command line interface (CLI), check available databases, and run SELECT statements, here's a quick walkthrough:

---

### ✅ 1. **Connect to the PostgreSQL CLI**

Use the `psql` command:

```bash
psql -h localhost -U your_username -d your_database
```

You may need to provide a password after running this command.

For the KweliVote project specifically:
```bash
psql -h localhost -U kwelivote -d kwelivote_db
```

If you're using the default PostgreSQL user:
```bash
sudo -u postgres psql
```

### ✅ 2. **Check Available Databases**

Once connected to the PostgreSQL CLI, use these commands:

```sql
-- List all databases
\l

-- Connect to a specific database
\c database_name

-- List all tables in the current database
\dt

-- Show table structure
\d table_name
```

### ✅ 3. **Run SELECT Statements**

```sql
-- Basic SELECT statement
SELECT * FROM table_name;

-- Select specific columns
SELECT column1, column2 FROM table_name;

-- Filter with WHERE clause
SELECT * FROM table_name WHERE condition;

-- Join tables
SELECT t1.column1, t2.column2
FROM table1 t1
JOIN table2 t2 ON t1.id = t2.table1_id;

-- Group and aggregate data
SELECT column1, COUNT(*) 
FROM table_name
GROUP BY column1;

-- Sort results
SELECT * FROM table_name ORDER BY column1 DESC;
```

### ✅ 4. **Useful PostgreSQL Commands**

```sql
-- Exit PostgreSQL CLI
\q

-- Execute SQL from file
\i filename.sql

-- Get help on PostgreSQL commands
\?

-- Get help on SQL commands
\h

-- Save query results to file
\o output_file.txt
SELECT * FROM table_name;
\o

-- Show command history
\s
```
