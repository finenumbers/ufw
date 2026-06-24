# Import et export de configuration

Vous pouvez exporter et importer une **configuration complète des serveurs** (tous les serveurs, identités, métadonnées des règles) au format JSON **v2**.

## Export

1. Depuis la page **Serveurs**, utiliser **Enregistrer la configuration**
2. Resaisir votre **mot de passe de compte** (authentification renforcée)
3. Télécharger le fichier JSON

### Avertissement de sécurité important

Le fichier d'export contient des **mots de passe SSH et clés privées en clair**. Traitez-le comme un secret :

- Stocker chiffré (coffre-fort de gestionnaire de mots de passe, disque chiffré)
- Ne jamais committer dans git ni envoyer sur des canaux non sécurisés
- Un événement d'audit `CONFIG_EXPORT` est enregistré lors d'un export réussi

## Import

1. Utiliser **Charger la configuration** sur la page Serveurs
2. Sélectionner le fichier JSON v2
3. Examiner le résumé : serveurs à créer, mettre à jour, supprimer
4. Confirmer — l'import s'exécute dans une transaction (upsert d'abord, suppression en dernier)

### Comportement destructif

Les serveurs **absents** du fichier d'import peuvent être **supprimés** avec toutes leurs règles et snapshots. Lisez attentivement la boîte de dialogue de confirmation.

Les clés hôte SSH importées peuvent être marquées **non vérifiées** jusqu'à ce que vous lanciez un test SSH sur chaque serveur.

## Export vs sauvegarde Postgres

| Méthode | Contenu | Idéal pour |
|---------|---------|------------|
| **Export de configuration (JSON)** | Configuration lisible + secrets en clair | Migration entre instances, copie de secours |
| **Dump Postgres** | Base complète incluant secrets chiffrés | Restauration complète avec le même `APP_ENCRYPTION_KEY` |
| **Sauvegarde `.env`** | Secrets d'exécution | Requis pour déchiffrer les identifiants BD après restauration |

Pour une reprise complète après sinistre, sauvegardez **Postgres et `.env`** — voir [Sauvegarde et restauration](../operations/backup-restore.md).

## Documentation associée

- [Journal d'audit et export](../administration/audit-log-and-export.md)
- [Identités SSH](./ssh-identities.md)
