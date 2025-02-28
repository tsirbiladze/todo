# Database Schema Evolution Strategy

## Overview

This document outlines our approach to database schema evolution using Prisma with MySQL. It provides guidelines for making schema changes safely and consistently.

## Migration Workflow

### 1. Development Workflow

1. **Make Schema Changes**:
   - Edit the `prisma/schema.prisma` file to reflect your desired changes
   - Follow the naming and relationship conventions documented below

2. **Create Migration**:
   ```bash
   npx prisma migrate dev --name descriptive_migration_name
   ```
   - Use descriptive names for migrations (e.g., `add_user_preferences`, `update_task_relations`)
   - Review the generated SQL in `prisma/migrations/[timestamp]_descriptive_migration_name/migration.sql`

3. **Test Migration**:
   - Verify the migration works as expected in your development environment
   - Run the test suite to ensure no regressions

### 2. Production Deployment

1. **Review Migrations**:
   - All migrations should be reviewed by at least one other team member
   - Pay special attention to potentially destructive changes

2. **Apply Migrations**:
   ```bash
   npx prisma migrate deploy
   ```
   - This command should be part of your deployment pipeline
   - Never run `prisma migrate dev` in production

3. **Backup Strategy**:
   - Always create a database backup before applying migrations in production
   - Have a rollback plan for each migration

## Schema Design Guidelines

### Naming Conventions

- **Models**: PascalCase singular nouns (e.g., `User`, `Task`, `Category`)
- **Fields**: camelCase (e.g., `firstName`, `createdAt`, `userId`)
- **Enums**: PascalCase (e.g., `Priority`, `Status`)
- **Relations**: Descriptive names that reflect the relationship

### Indexing Strategy

- Add indexes for all foreign keys
- Add indexes for frequently queried fields
- Add composite indexes for fields commonly queried together
- Document the reasoning for each non-standard index

### Relationship Best Practices

- Use appropriate cascade delete behaviors:
  - `CASCADE` for child records that should be deleted with parent
  - `SET NULL` for optional relationships
  - `RESTRICT` when deletion should be prevented if references exist

- Bidirectional relationships should be consistent in their naming

## Testing Migrations

### Unit Tests

Create unit tests for:
- Model validations
- Complex queries
- Business logic that depends on schema structure

### Migration Tests

For complex migrations, create specific tests that:
- Verify data integrity after migration
- Test edge cases and potential failure scenarios
- Validate performance for large datasets

## Handling Breaking Changes

When making breaking changes:

1. **Plan for Backward Compatibility**:
   - Consider adding a new field/table instead of modifying existing ones
   - Use database views to maintain compatibility with old code

2. **Multi-Phase Migrations**:
   For complex changes, use a multi-phase approach:
   - Phase 1: Add new structure without removing old
   - Phase 2: Update application code to use new structure
   - Phase 3: Remove old structure after confirming no dependencies

## Troubleshooting

### Common Issues

1. **Migration Conflicts**:
   - If you encounter conflicts between migrations, never delete migration files
   - Instead, create a new migration that resolves the conflict

2. **Reset Development Database**:
   ```bash
   npx prisma migrate reset
   ```
   - This will drop and recreate your database (development only!)

3. **Inspect Database State**:
   ```bash
   npx prisma migrate status
   ```
   - Shows the current state of migrations in your database

## Resources

- [Prisma Migration Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- Internal team knowledge base (link) 