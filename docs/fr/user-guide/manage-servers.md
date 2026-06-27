# Gérer les serveurs

Ce guide couvre le cycle de vie des serveurs : ajout, configuration UFW, actualisation, modification et suppression.

## Prérequis

Créez au moins une [identité SSH](../concepts/ssh-identities.md) avant d'ajouter un serveur.

## Ajouter un serveur

1. Barre latérale → **Serveurs** ou cliquez sur **Ajouter un serveur**
2. Renseignez le nom, l'hôte, le port et sélectionnez une identité
3. Cliquez sur **Créer le serveur** — la connexion SSH est vérifiée automatiquement à l'envoi
4. En cas de succès, vous arrivez sur le tableau de bord du serveur

Si la vérification échoue, vérifiez l'accessibilité de l'hôte, les identifiants, le pare-feu autorisant SSH depuis l'hôte Docker et la [validation d'hôte](../concepts/servers-and-ssh.md).

## Tableau de bord du serveur

Le tableau de bord charge l'**état UFW en cache** depuis le dernier snapshot Postgres — pas de SSH au premier affichage. Les panneaux Port scan et Docker chargent également les derniers résultats en cache depuis Postgres lorsqu'ils sont disponibles.

| Statut | Actions disponibles |
|--------|---------------------|
| UFW non installé | **Actualiser le statut**, puis **Installer UFW** (après actualisation confirmant l'absence d'UFW) |
| Installé mais inactif | **Actualiser le statut** uniquement — UFW est déjà installé ; utilisez l'actualisation pour détecter l'état actif/inactif |
| Installé et actif | **Ajouter une règle**, **Enregistrer les règles**, **Actualiser le statut** |

Cliquez d'abord sur **Actualiser le statut** pour vérifier SSH et détecter si UFW est installé. **Installer UFW** reste désactivé tant qu'une actualisation réussie n'indique pas l'absence d'UFW.

Jusqu'à ce que vous exécutiez **Actualiser le statut**, le badge UFW peut afficher une étiquette actif/inactif **en cache** du dernier snapshot.

Utilisez **Actualiser le statut** pour récupérer le dernier état UFW via SSH et synchroniser le tableau des règles. Si vous avez des modifications de règles **non enregistrées**, l'application demande confirmation avant de recharger depuis le serveur.

Si l'application **n'a pas encore de snapshot UFW** dans Postgres (nouveau serveur, jamais actualisé, etc.), une synchronisation automatique en arrière-plan s'exécute une fois pour remplir le cache.

## Compteurs de règles

Deux compteurs distincts apparaissent dans l'interface :

| Emplacement | Libellé | Signification |
|-------------|---------|---------------|
| Carte de la **liste des serveurs** | règles enregistrées | Nombre de règles stockées dans les métadonnées locales (`ruleRecord`) |
| Badge du **tableau de bord** sous Ajouter une règle | dans le tableau | Nombre de lignes dans le tableau des règles (session de brouillon active) |

Ces nombres peuvent différer pendant l'édition, la synchronisation ou l'import. Le badge du tableau de bord correspond au total du tableau des règles.

## Modifier un serveur

1. Ouvrir le serveur → **Modifier**
2. Changer le nom, l'hôte, le port ou l'identité
3. La connexion SSH est vérifiée automatiquement à l'envoi si les paramètres de connexion ont changé

La page de modification affiche l'empreinte de la clé hôte enregistrée et un avertissement **Non vérifié** le cas échéant — il n'y a pas de bouton de test séparé.

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
