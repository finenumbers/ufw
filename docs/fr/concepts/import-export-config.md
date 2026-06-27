# Import et export de configuration

Vous pouvez exporter et importer une **configuration serveur complète** (tous les serveurs, identités, métadonnées de règles) au format JSON **v2**.

## Export

1. Depuis la page **Serveurs**, utilisez **Enregistrer la configuration**
2. Saisissez à nouveau votre **mot de passe de compte** (authentification renforcée)
3. Téléchargez le fichier JSON

### Avertissement de sécurité important

Le fichier d'export contient **des mots de passe SSH et des clés privées en clair**. Traitez-le comme un secret :

- Stockez-le chiffré (coffre-fort de gestionnaire de mots de passe, disque chiffré)
- Ne le commitez jamais dans git ni ne l'envoyez sur des canaux non sécurisés
- Un événement d'audit `CONFIG_EXPORT` est écrit lors d'un export réussi

## Import

1. Utilisez **Charger la configuration** sur la page Serveurs
2. Sélectionnez le fichier JSON v2
3. Examinez le résumé : serveurs à créer, mettre à jour, supprimer
4. Saisissez à nouveau votre **mot de passe de compte** dans la boîte de dialogue de confirmation
5. Confirmez — l'import s'exécute dans une transaction (upsert d'abord, suppression en dernier)

L'import utilise les mêmes limites de débit que l'export (10 tentatives par minute par utilisateur).

### Comportement destructif

Les serveurs **absents** du fichier d'import peuvent être **supprimés** avec toutes leurs règles et snapshots. Lisez attentivement la boîte de dialogue de confirmation.

Les clés hôte SSH importées sont marquées **Non vérifiées** — exécutez **Actualiser le statut** sur chaque tableau de bord serveur avant d'appliquer les règles.

### Limites d'import

- Les imports de règles (CSV, XLSX, JSON) sont limités à **10 000 lignes** par fichier.
- L'**aperçu** d'import de configuration est limité à **10 tentatives par minute** par utilisateur — attendez et réessayez si vous atteignez la limite.

## Export vs sauvegarde Postgres

| Méthode | Contient | Idéal pour |
|---------|----------|------------|
| **Export de configuration (JSON)** | Configuration lisible + secrets en clair | Migration entre instances, copie de secours |
| **Dump Postgres** | Base complète incluant secrets chiffrés | Restauration complète avec le même `APP_ENCRYPTION_KEY` |
| **Sauvegarde `.env`** | Secrets d'exécution | Requis pour déchiffrer les identifiants DB après restauration |

Pour une reprise après sinistre complète, sauvegardez **à la fois** Postgres **et** `.env` — voir [Sauvegarde et restauration](../operations/backup-restore.md).

## Documentation associée

- [Journal d'audit et export](../administration/audit-log-and-export.md)
- [Identités SSH](./ssh-identities.md)
