# Import et export de configuration

Exportez et importez un fichier **JSON v2** contenant tous les serveurs, identités SSH (y compris secrets déchiffrés) et métadonnées associées. À utiliser pour sauvegarde, migration ou reprise après sinistre — pas pour l'édition quotidienne des règles.

L'import/export au niveau des règles (CSV, XLSX) est séparé — voir [Éditer et appliquer les règles](../user-guide/edit-and-apply-rules.md).

## Flux d'export

1. Liste **Serveurs** → **Enregistrer la configuration**
2. Saisir le **mot de passe** de votre compte (authentification renforcée)
3. Télécharger le fichier JSON (`servers-config-YYYY-MM-DD.json`)

L'export inclut les secrets SSH déchiffrés. Stockez le fichier chiffré au repos ; supprimez-le lorsqu'il n'est plus nécessaire.

Un jeton à courte durée de vie protège l'API de téléchargement après confirmation du mot de passe.

Limite de débit : 5 exports par minute par utilisateur.

## Flux d'import

1. **Charger la configuration** → sélectionner le fichier JSON
2. L'**aperçu** montre le diff : serveurs et identités à créer, mettre à jour ou supprimer
3. Confirmer avec mot de passe → l'import applique les modifications

L'import attend que les files d'attente par serveur deviennent inactives et bloque si des opérations destructives entreraient en conflit avec un travail actif.

## Format JSON v2

| Section | Contenu |
|---------|---------|
| **version** | `2` |
| **identities** | Nom, nom d'utilisateur, méthode d'auth, secrets |
| **servers** | Nom, hôte, port, référence d'identité, champs de clé hôte |

Les fichiers legacy array-only ou v1 sont rejetés.

Les clés en double (même hôte + port + identité) sont rejetées à l'analyse.

## Sémantique de suppression à l'import

Les serveurs présents en base de données mais absents du fichier importé apparaissent dans l'ensemble **suppression** de l'aperçu. Confirmez uniquement si vous entendez retirer ces enregistrements serveur et toutes les règles, brouillons et snapshots associés localement.

UFW distant sur les enregistrements serveur supprimés **n'est pas** modifié.

## Documentation associée

- [Identités SSH](./ssh-identities.md)
- [Sauvegarde et restauration](../operations/backup-restore.md)
- [Journal d'audit et export](../administration/audit-log-and-export.md)
