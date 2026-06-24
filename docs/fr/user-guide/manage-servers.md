# Gérer les serveurs

Ce guide couvre le cycle de vie des serveurs : ajout, configuration UFW, actualisation, modification et suppression.

## Prérequis

Créez au moins une [identité SSH](../concepts/ssh-identities.md) avant d'ajouter un serveur.

## Ajouter un serveur

1. Barre latérale → **Serveurs** ou cliquer sur **Ajouter un serveur**
2. Remplir le nom, l'hôte, le port et sélectionner une identité
3. Cliquer sur **Créer le serveur** — le test SSH s'exécute automatiquement
4. En cas de succès, vous arrivez sur le tableau de bord du serveur

Si le test SSH échoue, vérifiez l'accessibilité de l'hôte, les identifiants, le pare-feu autorisant SSH depuis l'hôte Docker et la [validation de l'hôte](../concepts/servers-and-ssh.md).

## Tableau de bord du serveur

Le tableau de bord affiche le statut UFW :

| Statut | Actions disponibles |
|--------|---------------------|
| UFW non installé | **Installer UFW** |
| Installé mais inactif | **Activer UFW** |
| Installé et actif | **Règles**, actualisation, test SSH |

Utilisez **Actualiser le statut** pour récupérer le dernier état UFW et synchroniser le tableau des règles.

## Modifier un serveur

1. Ouvrir le serveur → **Modifier**
2. Changer le nom, l'hôte, le port ou l'identité
3. Test SSH requis avant l'enregistrement si les paramètres de connexion ont changé

## Supprimer un serveur

**Zone dangereuse** sur la page de modification ou les paramètres du serveur :

- Supprime toutes les règles locales, brouillons et snapshots pour ce serveur
- Ne **modifie pas** UFW distant

Confirmez uniquement si vous souhaitez retirer les données de gestion, pas effacer les règles de pare-feu distantes.

## Outils de la liste des serveurs

Depuis la page principale des serveurs, vous pouvez :

- **Enregistrer la configuration** / **Charger la configuration** — export/import JSON complet (voir [Import et export de configuration](../concepts/import-export-config.md))

## Documentation associée

- [Serveurs et SSH](../concepts/servers-and-ssh.md)
- [Éditer et appliquer les règles](./edit-and-apply-rules.md)
