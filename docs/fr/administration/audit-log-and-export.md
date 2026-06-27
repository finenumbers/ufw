# Journal d'audit et export

Deux couches de journalisation existent : **journaux d'opérations** (techniques) et **événements d'audit** (sécurité/conformité).

## Événements d'audit

Écrits dans la table `audit_event`. Exemples :

| Action | Quand |
|--------|-------|
| `LOGIN` | Session utilisateur créée |
| `LOGOUT` | Session supprimée |
| `CONFIG_EXPORT` | Configuration serveur exportée (après resaisie du mot de passe) |

Consultez sur **Historique des opérations** → onglet **Audit**.

## Journaux d'opérations

Écrits pour les tâches longues : application, actualisation, installation, scan de ports, inventaire/contrôle Docker, etc. Inclut les métadonnées d'étapes et messages de succès/échec.

Consultez sur **Historique des opérations** → onglet **Opérations** ou la **bannière d'opération** en direct.

## Piste d'audit d'export de configuration

Chaque export réussi crée un enregistrement d'audit `CONFIG_EXPORT` avec l'ID utilisateur et l'horodatage. Utilisez ceci pour tracer qui a téléchargé des fichiers d'identifiants en clair.

## Rétention

La rétention des snapshots conserve les **10** derniers snapshots par serveur (purge automatique des plus anciens). La rétention des journaux d'opérations peut être effacée manuellement depuis l'interface.

Planifiez une politique de sauvegarde pour les données d'audit si la conformité exige une rétention longue — voir [Sauvegarde et restauration](../operations/backup-restore.md).

## Documentation associée

- [Import et export de configuration](../concepts/import-export-config.md)
- [Historique des opérations](../user-guide/operations-history.md)
- [SECURITY.md](../../../SECURITY.md)
