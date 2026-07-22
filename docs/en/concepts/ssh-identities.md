# SSH identities

An **SSH identity** stores reusable connection credentials: username, authentication method, and encrypted secrets. Each **server** references one identity.

## Authentication methods

| Method | Stored secret | Typical use |
|--------|---------------|-------------|
| **Password** | SSH password | Simple lab or legacy hosts |
| **Private key** | PEM private key | Production keys without passphrase |
| **Private key + passphrase** | Key and passphrase | Encrypted private keys |

Secrets are encrypted at rest with **AES-256-GCM** using `APP_ENCRYPTION_KEY`. They are decrypted only in memory when opening an SSH connection.

## Creating and editing

1. Sidebar → **SSH Identities**
2. **Add Identity** or open an existing row → **Edit**
3. Required fields: display name, SSH username, auth method, secret(s)

On **edit**, leaving password/key fields empty keeps the existing secret unchanged.

Validation rejects empty names and invalid auth combinations before save.

## Linking to servers

When creating or editing a server, select an identity from the dropdown. Changing a server's identity triggers SSH verification on save if connection parameters changed.

## Deleting an identity

Deletion is blocked while any server still references the identity. The UI lists linked servers. Reassign or delete those servers first.

## Security notes

- Identity secrets appear in **configuration export** (JSON v2) after password confirmation — treat exports as highly sensitive
- Rotating `APP_ENCRYPTION_KEY` without re-entering secrets makes existing ciphertext unreadable — plan key rotation carefully
- One identity can be shared by many servers (same admin user, same key)

## Related docs

- [Servers and SSH](./servers-and-ssh.md)
- [Import and export config](./import-export-config.md)
- [Security model](../administration/security-model.md)
