# Scan de ports (guide utilisateur)

Lorsqu'il est activé par votre administrateur, le **panneau de scan de ports** sur chaque page serveur découvre les services TCP accessibles de l'extérieur et les compare à vos règles UFW.

Les administrateurs activent et règlent le scan via les variables d'environnement — voir [Scan externe de ports (déploiement)](../deployment/port-scan.md).

## Quand le panneau apparaît

Le panneau n'est visible que lorsque `PORT_SCAN_ENABLED=true` dans l'environnement de l'application. Si désactivé, la page serveur affiche uniquement les règles UFW.

## Démarrer un scan

1. Ouvrir un tableau de bord serveur.
2. Dans la barre d'outils du tableau de bord UFW, cliquer sur **Scan ports** (ou utiliser la section scan de ports si affichée sous le tableau de règles).
3. Une bannière d'opérations apparaît avec les étapes : résolution cible → découverte → enrichissement → normalisation.
4. Les résultats se remplissent dans le tableau lorsque le scan se termine avec succès.

La découverte TCP complète (ports 1–65535) peut prendre **30 minutes ou plus**. Le scan s'exécute depuis le conteneur app vers le nom d'hôte ou l'IP enregistré du serveur — pas via SSH.

## États de scan

| Statut | Signification | Comportement UI |
|--------|---------------|-----------------|
| **PENDING** | Tâche de scan créée, pas encore démarrée | Affiche *Scanning...* ; polling actif |
| **RUNNING** | Naabu/Nmap en cours | Progression via bannière d'opérations ; tableau peut être vide ou afficher les résultats précédents |
| **SUCCESS** | Scan terminé | Tableau complet des résultats ; date et nombre de ports dans l'en-tête du panneau |
| **FAILED** | Erreur ou timeout | Message d'erreur affiché ; résultats réussis précédents peuvent encore s'afficher |

## Reprise après actualisation de page

Depuis v0.9.2, l'ouverture d'une page serveur charge le **dernier scan de tout statut** depuis la base de données — pas seulement le dernier réussi. Si vous actualisez le navigateur pendant qu'un scan est `PENDING` ou `RUNNING`, le panneau reprend le polling et la bannière d'opérations reprend l'opération active.

## Tableau des résultats

| Colonne | Description |
|---------|-------------|
| **Port** | Numéro de port TCP |
| **Proto** | Protocole (typiquement `tcp`) |
| **State** | Généralement `open` pour les ports découverts |
| **Service** | Nom de service Nmap lorsque disponible |
| **Product / Version** | Chaîne produit et version si détectée |
| **UFW** | Couverture relative à votre dernier snapshot UFW |

### Valeurs de couverture UFW

La couverture utilise la **sémantique scan externe** — ce qu'un client anonyme sur Internet verrait :

| Valeur | Signification |
|--------|---------------|
| **Allowed** | ALLOW/LIMIT entrant depuis **any** couvre ce port |
| **Not in UFW** | Port ouvert de l'extérieur mais non couvert par une règle allow entrante publique — à revoir |
| **Denied** | DENY/REJECT entrant depuis **any** cible ce port |
| **Unknown** | UFW inactif ou aucun snapshot disponible |

Les règles whitelist uniquement (IP/CIDR source spécifique, ou `To Port = any` sans allow public) **ne comptent pas** comme *Allowed* aux fins du scan externe.

## Chevauchement et limites de débit

| Situation | Message / comportement |
|-----------|------------------------|
| Scan déjà en cours sur ce serveur | *Un scan de ports est déjà en cours pour ce serveur.* — attendre la fin |
| Scan répété dans les 30 secondes | Message de limite de débit avec compte à rebours de réessai |

Un seul scan actif par serveur est autorisé à la fois. Le scan de ports ne bloque pas l'actualisation ou l'application UFW sur le même serveur.

## Relation aux statistiques de la liste serveurs

La carte **liste Serveurs** peut afficher un compte de ports ouverts depuis le dernier scan réussi. La ligne d'inventaire du tableau de bord affiche la date de scan et le nombre de résultats lorsqu'un scan réussi existe.

Les comptes de règles enregistrées sur les cartes de liste font référence aux **métadonnées de règles locales** (`ruleRecord`), pas aux numéros de règles UFW distantes.

## Historique des opérations

Chaque scan crée une entrée de journal d'opérations de type `port.scan`. Les événements d'audit `PORT_SCAN_STARTED` et `PORT_SCAN_COMPLETED` sont enregistrés au démarrage et à la fin réussie.

Voir [Historique des opérations](./operations-history.md).

## Documentation associée

- [Scan externe de ports (déploiement)](../deployment/port-scan.md)
- [Opérations et concurrence](../concepts/operations-and-concurrency.md)
- [Gérer les serveurs](./manage-servers.md)
