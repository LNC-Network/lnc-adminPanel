# Project ENV Encryption Implementation

## Overview

All sensitive data in the Project ENV feature is now encrypted using AES-256-CBC encryption before being stored in the database. This ensures that passwords and credential values are protected at rest.

## Encryption Details

### Algorithm

- **Algorithm**: AES-256-CBC (Advanced Encryption Standard with Cipher Block Chaining)
- **Key Size**: 256 bits (32 bytes)
- **IV (Initialization Vector)**: Randomly generated 16 bytes for each encryption operation

### What is Encrypted

1. **Project Passwords**: Used to protect access to project credentials
2. **Credential Values**: Environment variable values (API keys, database URLs, secrets, etc.)

### What is NOT Encrypted

- Project names and descriptions (metadata for display)
- Credential keys (e.g., "DATABASE_URL", "API_KEY") - needed for display
- User IDs and timestamps
- Project IDs

## Implementation

### Environment Variable

Add to `.env` file:

```env
# Encryption key for Project ENV credentials (32 bytes hex = 64 characters)
ENCRYPTION_KEY=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2
```

**IMPORTANT**:

- The encryption key MUST be 64 hexadecimal characters (32 bytes)
- Change the default key to your own secure random key in production
- Keep this key SECRET and NEVER commit it to version control
- Losing this key means losing access to all encrypted data

### Generate a Secure Key

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

## Files Modified

### API Routes

All three API route files now include encryption/decryption utilities:

1. **app/api/projects/route.ts**

   - Encrypts project password on creation
   - Project password stored encrypted in database

2. **app/api/projects/verify/route.ts**

   - Decrypts stored password for verification
   - Compares decrypted password with user input

3. **app/api/projects/credentials/route.ts**
   - Encrypts credential values on creation
   - Decrypts credential values when fetching
   - Returns decrypted values to authenticated users

## Encryption Flow

### Creating a Project

```
User Input: "my-password"
    ↓
encrypt("my-password")
    ↓
Database: "a1b2c3d4e5f6a7b8:9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f..."
```

### Verifying Password

```
User Input: "my-password"
Database: "a1b2c3d4e5f6a7b8:9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f..."
    ↓
decrypt(database_value)
    ↓
"my-password" === "my-password" ✅
```

### Adding Credential

```
User Input:
  key: "DATABASE_URL"
  value: "postgresql://user:pass@host/db"
    ↓
Database:
  key: "DATABASE_URL" (not encrypted)
  value: "b2c3d4e5f6a7b8c9:8d7e6f5a4b3c2d1e0f9a8b7c6d..." (encrypted)
```

### Fetching Credentials

```
Database: "b2c3d4e5f6a7b8c9:8d7e6f5a4b3c2d1e0f9a8b7c6d..."
    ↓
decrypt(database_value)
    ↓
API Response: "postgresql://user:pass@host/db" (decrypted)
```

## Security Benefits

1. **Data at Rest Protection**: Even if the database is compromised, encrypted data cannot be read without the encryption key

2. **Defense in Depth**: Adds an additional layer of security beyond database access controls

3. **Compliance**: Helps meet security compliance requirements for storing sensitive data

4. **Automatic**: Encryption/decryption happens transparently - no changes needed to the frontend

## Testing

### Encryption Test Suite

Run the encryption test to verify everything is working:

```bash
node testing/test-encryption.js
```

This test:

- ✅ Creates a project with encrypted password
- ✅ Verifies correct password decryption
- ✅ Rejects incorrect passwords
- ✅ Adds encrypted credentials
- ✅ Fetches and decrypts credentials
- ✅ Verifies decrypted values match originals

### Full Test Suite

```bash
node testing/test-project-env.js
node testing/test-project-env-all-roles.js
```

## Database Schema

No changes required to the database schema. The encrypted data is stored as TEXT in the existing columns:

- `projects.password` - Stores encrypted password (format: "iv:encrypted_data")
- `env_credentials.value` - Stores encrypted credential value (format: "iv:encrypted_data")

## Migration Notes

### Existing Data

If you have existing unencrypted data in the database, you'll need to:

1. Export existing data
2. Clear the tables
3. Re-import data (which will automatically encrypt it)

OR

4. Write a migration script to encrypt existing data in place

### Encryption Key Rotation

To rotate the encryption key:

1. Decrypt all data with old key
2. Update ENCRYPTION_KEY in .env
3. Re-encrypt all data with new key
4. Restart the server

**Note**: This requires a maintenance window where the feature is unavailable.

## Performance Impact

- **Minimal**: Encryption/decryption adds negligible overhead (~1ms per operation)
- **No caching needed**: Operations are fast enough for real-time use
- **Scalable**: Works efficiently even with thousands of credentials

## Error Handling

The API includes error handling for encryption failures:

- Invalid encryption key format
- Corrupted encrypted data
- Missing IV (initialization vector)

All encryption errors return HTTP 500 with appropriate error messages.

## Best Practices

1. ✅ **Never log decrypted values** - All logs should only show encrypted data
2. ✅ **Rotate keys periodically** - Change encryption key every 6-12 months
3. ✅ **Backup encryption key securely** - Store in a password manager or secret vault
4. ✅ **Use environment variables** - Never hardcode the encryption key
5. ✅ **Monitor access** - Log who accesses encrypted credentials
6. ✅ **Audit regularly** - Review encrypted data access patterns

## Future Enhancements

Potential improvements for future versions:

- Key rotation automation
- Multiple encryption keys with versioning
- Hardware Security Module (HSM) integration
- Audit logging for decryption events
- Field-level encryption for additional metadata
