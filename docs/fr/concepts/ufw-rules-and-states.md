# Règles UFW et états

Le tableau de règles affiche une **vue unifiée** : règles UFW distantes, métadonnées locales et vos modifications de brouillon. Les **couleurs** des lignes reflètent la relation de chaque ligne avec le serveur et la base de données.

## Structure d'une règle

Chaque ligne possède :

| Couche | Champs |
|--------|--------|
| **Noyau** | action, direction, protocole, adresses, ports, interface, profil app, mode log, commentaire, IPv6 |
| **Métadonnées UI** | groupe, nom, notes (stockées localement, non envoyées à UFW sauf dans le commentaire) |
| **Origine** | état de sync déterminant la couleur de ligne |

Les empreintes identifient les règles à travers les rechargements distants et les modifications locales.

## États d'origine

| État | Signification de la couleur | Situation typique |
|------|----------------------------|-------------------|
| **MATCHED** | Distant et métadonnées locales concordent | Règle synchronisée stable |
| **REMOTE_ONLY** | Sur le serveur, absent des métadonnées locales | Nouvelle règle distante après actualisation |
| **LOCAL_ONLY** | En BD locale, absent du serveur | Ajout en attente ou supprimé à distance |
| **DRAFT_ONLY** | Modification de brouillon non encore appliquée | Nouvelle ligne ou champs noyau modifiés |
| **CONFLICT** | Même empreinte, champs noyau différents | Dérive — revoir avant application |
| **DELETED** | Marquée supprimée dans le brouillon | Sera retirée à l'application |

Les couleurs aident à repérer la dérive **avant** l'application. Après **Resynchronisation forcée depuis le serveur**, le brouillon se réaligne sur le snapshot distant.

## Deux comptes de règles

L'interface affiche des comptes différents selon l'emplacement :

| Emplacement | Libellé | Compte |
|-------------|---------|--------|
| Carte **liste Serveurs** | règles enregistrées | Lignes dans `ruleRecord` (métadonnées locales) |
| Badge **tableau de bord** | dans le tableau | Lignes du tableau de la session de brouillon active |

Ces comptes diffèrent pendant l'édition, l'import ou la sync. Le badge du tableau de bord correspond à la longueur du tableau visible.

## L'ordre compte

UFW évalue les règles dans l'ordre. Le tableau supporte le réordonnancement par glisser-déposer. L'application peut émettre des opérations de resync d'ordre lorsque la numérotation distante diverge de l'ordre de votre brouillon.

## Métadonnées distantes vs locales

- Les **champs noyau distants** proviennent de la sortie analysée de `ufw status numbered`
- **Groupe, nom, notes** n'existent que dans UFW Remote Manager sauf s'ils sont copiés dans les commentaires de règles UFW
- L'application écrit les champs noyau sur le serveur ; les métadonnées UI restent dans Postgres

## Documentation associée

- [Workflow brouillon et application](./draft-apply-workflow.md)
- [Éditer et appliquer les règles](../user-guide/edit-and-apply-rules.md)
