# Gérer les serveurs

Ce guide couvre le cycle de vie des serveurs : ajout, tableau de bord, actualisation, installation UFW, modification, suppression et statistiques de liste.

## Prérequis

Créez au moins une [identité SSH](../concepts/ssh-identities.md) avant d'ajouter un serveur.

## Ajouter un serveur

1. Barre latérale → **Serveurs** → **Ajouter un serveur**
2. Remplir nom, hôte, port, sélectionner l'identité
3. **Créer le serveur** — SSH vérifié automatiquement à la soumission
4. En cas de succès, ouvrir le tableau de bord du serveur

Si la vérification échoue, vérifiez l'accessibilité de l'hôte, les identifiants, le pare-feu autorisant SSH depuis l'hôte Docker et la [validation d'hôte](../concepts/servers-and-ssh.md).

## Tableau de bord serveur

Le tableau de bord charge l'**état UFW en cache** depuis le dernier snapshot Postgres — pas de SSH au premier rendu.

Lorsque le scan de ports est activé, le panneau de scan charge le **dernier scan de tout statut** depuis Postgres (y compris les scans en cours depuis v0.9.2).

| Statut UFW | Actions |
|------------|---------|
| Non installé | **Actualiser le statut**, puis **Installer UFW** (après que l'actualisation confirme l'absence) |
| Installé mais inactif | **Actualiser le statut** — bouton d'installation masqué si UFW existe mais est inactif |
| Installé et actif | **Ajouter une règle**, **Enregistrer les règles**, **Actualiser le statut**, **Scan ports** optionnel |

**Actualiser le statut** exécute SSH en direct, met à jour le snapshot et synchronise le tableau de règles. **Installer UFW** reste désactivé jusqu'à ce que l'actualisation confirme que UFW n'est pas installé.

Jusqu'à l'actualisation, le badge UFW peut afficher un libellé **en cache** du dernier snapshot.

### Avertissement modifications non enregistrées

Si vous avez des modifications de brouillon non enregistrées, l'actualisation demande confirmation avant de recharger depuis le serveur.

### Synchronisation initiale automatique

Lorsqu'**aucun snapshot UFW** n'existe dans Postgres (nouveau serveur, jamais actualisé), une opération de sync en arrière-plan s'exécute une fois pour remplir le cache. Surveillez la bannière d'opérations.

## Statistiques de règles et de ports

| Emplacement | Métrique | Signification |
|-------------|----------|---------------|
| Carte **liste Serveurs** | règles enregistrées | Compte local `ruleRecord` |
| Carte **liste Serveurs** | ports ouverts | Résultats du dernier scan réussi (si activé) |
| Badge **tableau de bord** | dans le tableau | Nombre de lignes du tableau de règles visible |

Le *dans le tableau* du tableau de bord peut différer des *règles enregistrées* pendant l'édition ou avant l'application.

## Modifier un serveur

1. Page serveur → **Modifier**
2. Changer nom, hôte, port ou identité
3. SSH vérifié à la soumission lorsque les paramètres de connexion ont changé

La page de modification affiche l'empreinte de clé hôte et l'avertissement **non vérifiée** le cas échéant.

## Supprimer un serveur

**Zone dangereuse** sur la page de modification :

- Retire les règles locales, brouillons, snapshots, scans pour ce serveur
- **Ne modifie pas** UFW distant

Confirmez uniquement lors du retrait des données de gestion, pas pour effacer les règles de pare-feu distantes.

## Outils de configuration de la liste Serveurs

- **Enregistrer la configuration** / **Charger la configuration** — export/import JSON v2 complet — voir [Import et export de configuration](../concepts/import-export-config.md)

## Documentation associée

- [Serveurs et SSH](../concepts/servers-and-ssh.md)
- [Éditer et appliquer les règles](./edit-and-apply-rules.md)
- [Scan de ports](./port-scan.md)
