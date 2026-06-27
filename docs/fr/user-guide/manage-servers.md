# Gérer les serveurs

Ce guide couvre le cycle de vie des serveurs : ajout, configuration UFW, actualisation, modification et suppression.

## Prérequis

Créez au moins une [identité SSH](../concepts/ssh-identities.md) avant d'ajouter un serveur.

## Ajouter un serveur

1. Barre latérale → **Serveurs** ou cliquez sur **Ajouter un serveur**
2. Renseignez le nom, l'hôte, le port et sélectionnez une identité
3. Cliquez sur **Créer le serveur** — le test SSH s'exécute automatiquement
4. En cas de succès, vous arrivez sur le tableau de bord du serveur

Si le test SSH échoue, vérifiez l'accessibilité de l'hôte, les identifiants, le pare-feu autorisant SSH depuis l'hôte Docker et la [validation d'hôte](../concepts/servers-and-ssh.md).

## Tableau de bord du serveur

Le tableau de bord charge l'**état UFW en cache** depuis le dernier snapshot Postgres — pas de SSH au premier affichage. La page reste ainsi rapide.

| Statut | Actions disponibles |
|--------|---------------------|
| UFW non installé | **Actualiser le statut**, puis **Installer UFW** (si nécessaire) |
| Installé mais inactif | **Activer UFW** |
| Installé et actif | **Règles**, **Actualiser le statut** |

Cliquez d'abord sur **Actualiser le statut** pour vérifier SSH et détecter si UFW est installé. **Installer UFW** reste désactivé tant qu'une actualisation réussie n'indique pas l'absence d'UFW.

Utilisez **Actualiser le statut** pour récupérer le dernier état UFW via SSH et synchroniser le tableau des règles.

Si UFW est actif mais que l'application **n'a pas encore de snapshot** (première visite après activation), une synchronisation automatique en arrière-plan s'exécute une fois pour remplir le cache.

## Modifier un serveur

1. Ouvrir le serveur → **Modifier**
2. Changer le nom, l'hôte, le port ou l'identité
3. Test SSH requis avant l'enregistrement si les paramètres de connexion ont changé

## Supprimer un serveur

**Zone dangereuse** sur la page de modification ou les paramètres du serveur :

- Supprime toutes les règles locales, brouillons et snapshots pour ce serveur
- **Ne modifie pas** l'UFW distant

Confirmez uniquement si vous souhaitez supprimer les données de gestion, pas pour effacer les règles de pare-feu distantes.

## Outils de la liste des serveurs

Depuis la page principale des serveurs, vous pouvez :

- **Enregistrer la configuration** / **Charger la configuration** — export/import JSON complet (voir [Import et export de configuration](../concepts/import-export-config.md))

## Documentation associée

- [Serveurs et SSH](../concepts/servers-and-ssh.md)
- [Modifier et appliquer les règles](./edit-and-apply-rules.md)
