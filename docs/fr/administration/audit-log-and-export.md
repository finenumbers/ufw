# Journal d'audit et export

Deux pistes complémentaires : **journaux d'opérations** (progression des tâches) et **événements d'audit** (sécurité et conformité).

## Événements d'audit

Écrits dans Postgres sur actions sensibles. Exemples :

| Action | Quand |
|--------|-------|
| `LOGIN` / `LOGOUT` | Début/fin de session |
| `APPLY_PREVIEWED` / `APPLY_CONFIRMED` / `APPLY_COMPLETED` / `APPLY_FAILED` | Workflow d'application |
| `SNAPSHOT_LOADED` | Snapshot UFW capturé |
| `UFW_ENABLE` | Activation distante après installation |
| `PORT_SCAN_STARTED` / `PORT_SCAN_COMPLETED` | Cycle de vie scan de ports |
| `CONFIG_EXPORT` / `CONFIG_IMPORT` | Transfert configuration JSON v2 |
| CRUD serveur | Création/mise à jour/suppression d'enregistrements serveur |

Consulter sur **Historique des opérations** → onglet **Événements d'audit** avec défilement infini.

La rétention d'audit suit le stockage base de données — pas de purge automatique sauf si l'opérateur efface l'historique.

## Journaux d'opérations

Enregistrements techniques avec étapes, statut, horodatages et messages d'erreur. Voir [Historique des opérations](../user-guide/operations-history.md).

## Audit export de configuration

Chaque **Enregistrer la configuration** réussi crée une entrée d'audit. Le fichier export contient des **secrets SSH déchiffrés** — protéger comme un dump de coffre-fort de mots de passe.

Flux d'export :

1. Confirmation mot de passe (réauthentification)
2. Jeton de téléchargement à courte durée de vie
3. Téléchargement JSON via route API

Limite de débit : 5 exports par minute par utilisateur.

## Effacer l'historique

**Effacer l'historique** sur la page opérations retire les entrées de journal d'opérations selon l'action UI. Ne restaure pas les modifications serveur ni ne supprime tous les événements d'audit dans tous les cas — confirmer le texte de la boîte de dialogue pour le comportement actuel.

Ne modifie pas UFW distant ni les brouillons de règles locaux.

## Documentation associée

- [Import et export de configuration](../concepts/import-export-config.md)
- [Modèle de sécurité](./security-model.md)
