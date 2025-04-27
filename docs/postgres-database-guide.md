# PostgreSQL Database Guide for KweliVote

This guide provides comprehensive instructions for interacting with the KweliVote PostgreSQL database, including handling specialized data types like JSON and binary/image fields.

## Table of Contents
- [Connecting to PostgreSQL](#connecting-to-postgresql)
- [Database Operations](#database-operations)
- [Table Management](#table-management)
- [Querying Data](#querying-data)
- [Working with JSON Fields](#working-with-json-fields)
- [Handling Binary/Image Data](#handling-binaryimage-data)
- [Performance Tips](#performance-tips)

## Connecting to PostgreSQL

### Basic Connection

Connect to PostgreSQL using the command line interface:

```bash
# Basic connection pattern
psql -h [host] -p [port] -U [username] -d [database]

# Connect to KweliVote database
psql -h localhost -U kwelivote -d kwelivote_db

# Connect as postgres superuser
sudo -u postgres psql
```

### Connection Parameters

| Parameter | Description                  | Default   |
|-----------|------------------------------|-----------|
| `-h`      | Host name/address            | localhost |
| `-p`      | Port number                  | 5432      |
| `-U`      | Username                     | Current OS user |
| `-d`      | Database name                | Username  |
| `-W`      | Force password prompt        | -         |
| `-f`      | Execute commands from file   | -         |

### Connection String Format

For applications and scripts:

```
postgresql://[user[:password]@][host][:port][/database][?parameter=value&...]
```

Example:
```
postgresql://kwelivote:kwelivote@localhost:5432/kwelivote_db
```

## Database Operations

### Listing and Switching Databases

```sql
-- List all databases
\l
\list

-- Connect to KweliVote database
\c kwelivote_db
\connect kwelivote_db

-- Show current connection info
\conninfo

-- Get KweliVote database size
SELECT pg_size_pretty(pg_database_size('kwelivote_db'));
```

### Creating and Dropping Databases

```sql
-- Create a new database (if needed)
CREATE DATABASE kwelivote_db;

-- Create database with specific encoding and owner
CREATE DATABASE kwelivote_db
    WITH OWNER = kwelivote
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0;

-- Drop a database (close all connections first)
DROP DATABASE kwelivote_db;
```

## Table Management

### Viewing Tables and Their Structure

```sql
-- List all tables in KweliVote database
\dt

-- List all tables in the Django app schema
\dt kwelivote_app_*

-- Detailed information about specific tables
\d kwelivote_app_keyperson
\d kwelivote_app_voter
\d kwelivote_app_candidate
\d kwelivote_app_resultscount

-- List all schemas
\dn

-- Show table sizes
SELECT pg_size_pretty(pg_total_relation_size('kwelivote_app_keyperson')) AS "KeyPerson Size";
SELECT pg_size_pretty(pg_total_relation_size('kwelivote_app_voter')) AS "Voter Size";
SELECT pg_size_pretty(pg_total_relation_size('kwelivote_app_candidate')) AS "Candidate Size";
SELECT pg_size_pretty(pg_total_relation_size('kwelivote_app_resultscount')) AS "ResultsCount Size";
```

### Viewing Table Fields and Their Types

```sql
-- Show detailed table structure
\d+ kwelivote_app_keyperson
\d+ kwelivote_app_voter

-- Query column information for KeyPerson table
SELECT column_name, data_type, character_maximum_length, 
       column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'kwelivote_app_keyperson'
ORDER BY ordinal_position;

-- Query column information for Voter table
SELECT column_name, data_type, character_maximum_length, 
       column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'kwelivote_app_voter'
ORDER BY ordinal_position;
```

## Querying Data

### Basic Queries

```sql
-- Select all KeyPersons
SELECT * FROM kwelivote_app_keyperson;

-- Select specific columns from KeyPerson
SELECT nationalid, firstname, surname, role FROM kwelivote_app_keyperson;

-- Select KeyPersons with specific role
SELECT * FROM kwelivote_app_keyperson WHERE role = 'Polling Clerks';

-- Limit voter results
SELECT * FROM kwelivote_app_voter LIMIT 10;

-- Sort candidates by political party
SELECT * FROM kwelivote_app_candidate ORDER BY political_party ASC;

-- Count voters
SELECT COUNT(*) FROM kwelivote_app_voter;

-- Get distinct political parties
SELECT DISTINCT political_party FROM kwelivote_app_candidate;
```

### Joins and Relationships

```sql
-- Join ResultsCount with Candidate information
SELECT rc.resultscount_id, rc.polling_station, rc.votes, 
       c.firstname, c.surname, c.political_party
FROM kwelivote_app_resultscount rc
JOIN kwelivote_app_candidate c ON rc.candidate_id = c.nationalid;

-- Join ResultsCount with Presiding Officer details
SELECT rc.resultscount_id, rc.polling_station, rc.votes, 
       kp.firstname, kp.surname, kp.role
FROM kwelivote_app_resultscount rc
JOIN kwelivote_app_keyperson kp ON rc.presiding_officer_id = kp.nationalid;

-- Multiple joins for full results validation info
SELECT rc.resultscount_id, rc.polling_station, rc.votes,
       c.firstname AS candidate_firstname, c.surname AS candidate_surname,
       po.firstname AS po_firstname, po.surname AS po_surname,
       dpo.firstname AS dpo_firstname, dpo.surname AS dpo_surname
FROM kwelivote_app_resultscount rc
JOIN kwelivote_app_candidate c ON rc.candidate_id = c.nationalid
JOIN kwelivote_app_keyperson po ON rc.presiding_officer_id = po.nationalid
LEFT JOIN kwelivote_app_keyperson dpo ON rc.deputy_presiding_officer_id = dpo.nationalid;
```

## Working with JSON Fields

PostgreSQL has excellent support for JSON data through two main data types: `json` and `jsonb` (binary JSON). In the KweliVote app, biometric templates are stored as JSON.

### Viewing JSON Data

```sql
-- Select biometric template JSON from KeyPerson
SELECT nationalid, biometric_template FROM kwelivote_app_keyperson WHERE has_template = true;

-- Pretty print JSON templates
SELECT nationalid, biometric_template::text FROM kwelivote_app_keyperson WHERE has_template = true;

-- Extract userId from template
SELECT nationalid, biometric_template->>'userId' FROM kwelivote_app_keyperson WHERE has_template = true;

-- Extract fingerprint format from nested JSON
SELECT nationalid, biometric_template->'fingerprints'->0->>'format' 
FROM kwelivote_app_keyperson 
WHERE has_template = true;

-- Extract fingerprint quality as numeric value
SELECT nationalid, (biometric_template->'fingerprints'->0->>'quality')::numeric 
FROM kwelivote_app_keyperson 
WHERE has_template = true;
```

### Querying JSON Data

```sql
-- Filter KeyPersons by a JSON key value
SELECT nationalid, firstname, surname
FROM kwelivote_app_keyperson 
WHERE biometric_template->>'userId' = '12345';

-- Filter by fingerprint quality value
SELECT nationalid, firstname, surname
FROM kwelivote_app_keyperson 
WHERE (biometric_template->'fingerprints'->0->>'quality')::numeric > 80;

-- Check for key existence in biometric template
SELECT nationalid, firstname, surname
FROM kwelivote_app_keyperson 
WHERE biometric_template ? 'userId';

-- Find KeyPersons with specific fingerprint format
SELECT nationalid, firstname, surname
FROM kwelivote_app_keyperson 
WHERE biometric_template->'fingerprints'->0->>'format' = 'ISO_19794_2';

-- Get array length of fingerprints
SELECT nationalid, 
       jsonb_array_length(biometric_template->'fingerprints')::int AS num_fingerprints
FROM kwelivote_app_keyperson 
WHERE has_template = true;
```

### For KweliVote Specific JSON Fields

```sql
-- Extract all keys at the top level of biometric template
SELECT nationalid, jsonb_object_keys(biometric_template::jsonb)
FROM kwelivote_app_keyperson
WHERE has_template = true;

-- Example: viewing keyperson biometric template info
SELECT nationalid, 
       biometric_template->'userId' AS user_id,
       biometric_template->'fingerprints'->0->>'format' AS format,
       biometric_template->'fingerprints'->0->>'quality' AS quality,
       biometric_template->'formatInfo'->>'name' AS format_name
FROM kwelivote_app_keyperson
WHERE has_template = true;
```

## Handling Binary/Image Data

PostgreSQL stores binary data in `bytea` fields. KweliVote stores biometric data as binary and has ImageField for biometric images.

### Viewing Binary/Image Data

```sql
-- Check if biometric_data field contains data for KeyPersons
SELECT nationalid, octet_length(biometric_data) AS size_in_bytes 
FROM kwelivote_app_keyperson
WHERE biometric_data IS NOT NULL;

-- View hexadecimal representation of biometric data
SELECT nationalid, encode(biometric_data, 'hex') AS hex_data 
FROM kwelivote_app_keyperson
WHERE biometric_data IS NOT NULL;

-- Extract first 50 bytes of biometric data as hex (for inspection)
SELECT nationalid, encode(substring(biometric_data from 1 for 50), 'hex') 
FROM kwelivote_app_keyperson
WHERE biometric_data IS NOT NULL;
```

### Exporting Binary Data to Files

From command line:

```bash
# Export KeyPerson biometric data to a file using psql
psql -h localhost -U kwelivote -d kwelivote_db -c "\
    COPY (SELECT biometric_data \
    FROM kwelivote_app_keyperson WHERE nationalid = '12345678') \
    TO PROGRAM 'cat > /tmp/keyperson_biometric.dat' WITH BINARY"

# Export Voter biometric data to a file
psql -h localhost -U kwelivote -d kwelivote_db -c "\
    COPY (SELECT biometric_data \
    FROM kwelivote_app_voter WHERE nationalid = '12345678') \
    TO PROGRAM 'cat > /tmp/voter_biometric.dat' WITH BINARY"
```

Using SQL functions (if file_fdw extension is available):

```sql
-- Export to server filesystem using large objects
-- First step: Import bytea to large object
SELECT lo_from_bytea(0, biometric_data) AS loid 
FROM kwelivote_app_keyperson WHERE nationalid = '12345678';
-- This returns a large object ID (loid)

-- Then export that large object (must be done through client code or server function)
-- Example of server function:
CREATE OR REPLACE FUNCTION export_biometric_data_to_file(
    in_nationalid text, in_file text) 
RETURNS boolean AS $$
DECLARE
    loid oid;
    data bytea;
BEGIN
    SELECT biometric_data INTO data 
    FROM kwelivote_app_keyperson 
    WHERE nationalid = in_nationalid;
    
    loid := lo_from_bytea(0, data);
    PERFORM lo_export(loid, in_file);
    PERFORM lo_unlink(loid);
    
    RETURN true;
EXCEPTION WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql;
```

### For Base64 Encoded Images

If any images are stored as base64 within JSON fields:

```sql
-- Extract base64 images from JSON (if you have any such fields)
SELECT nationalid, biometric_template->>'imageData' AS base64_image 
FROM kwelivote_app_keyperson
WHERE biometric_template->>'imageData' IS NOT NULL;
```

## Performance Tips

### Optimizing Queries

```sql
-- Show query execution plan for KeyPerson query
EXPLAIN SELECT * FROM kwelivote_app_keyperson WHERE role = 'Polling Clerks';

-- Show execution plan with execution times for a voter query
EXPLAIN ANALYZE SELECT * FROM kwelivote_app_voter 
WHERE designated_polling_station = 'Polling Station 1';

-- Create an index on role column
CREATE INDEX idx_keyperson_role ON kwelivote_app_keyperson(role);

-- Create an index on polling_station for ResultsCount
CREATE INDEX idx_resultscount_polling ON kwelivote_app_resultscount(polling_station);

-- Check existing indexes
\di
```

### JSON Query Optimization

```sql
-- Create a GIN index for efficient JSON queries on biometric templates
CREATE INDEX idx_keyperson_template ON kwelivote_app_keyperson USING GIN (biometric_template);

-- Create index for specific JSON key in biometric template
CREATE INDEX idx_keyperson_userid ON kwelivote_app_keyperson ((biometric_template->>'userId'));
```

### Utility Commands

```sql
-- Show currently running queries
SELECT pid, age(clock_timestamp(), query_start), usename, query
FROM pg_stat_activity
WHERE query != '<IDLE>' AND query NOT ILIKE '%pg_stat_activity%'
ORDER BY query_start desc;

-- Kill a long-running query
SELECT pg_cancel_backend(pid);

-- Monitor table size growth
SELECT relname AS table_name,
       pg_size_pretty(pg_total_relation_size(relid)) AS total_size
FROM pg_catalog.pg_statio_user_tables
WHERE relname LIKE 'kwelivote_app_%'
ORDER BY pg_total_relation_size(relid) DESC;
```

---

## Additional Resources

- [PostgreSQL Official Documentation](https://www.postgresql.org/docs/)
- [JSON Functions and Operators](https://www.postgresql.org/docs/current/functions-json.html)
- [Binary Data Types](https://www.postgresql.org/docs/current/datatype-binary.html)