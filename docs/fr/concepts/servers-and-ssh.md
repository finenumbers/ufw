# Serveurs et SSH

Un enregistrement **serveur** représente un hôte Linux que vous gérez. L'application se connecte via SSH pour exécuter des commandes UFW et lire l'état du pare-feu.

## Champs du serveur

| Champ | Rôle |
|-------|------|
| **Nom** | Libellé affiché dans la barre latérale |
| **Hôte** | Adresse IP ou nom DNS (validé avant enregistrement) |
| **Port** | Port SSH (22 par défaut) |
| **Identité SSH** | Identifiants utilisés pour la connexion |

## Validation d'hôte (protection SSRF)

Avant l'enregistrement d'un serveur, l'hôte est validé :

- Les plages IP privées (10.x, 172.16–31, 192.168.x) sont **bloquées** par défaut
- Les adresses link-local et métadonnées cloud sont bloquées
- Les adresses privées IPv6 mappées IPv4 sont bloquées
- Liste blanche optionnelle : définir `SSH_ALLOWED_CIDRS` dans `.env` (p. ex. `10.0.0.0/8`) pour les réseaux internes

Cela empêche l'application d'être utilisée comme proxy pour scanner des réseaux internes.

## Vérification de résolution DNS

La validation s'effectue en deux étapes :

1. **À l'enregistrement** — la chaîne du nom d'hôte est vérifiée (littéraux privés, hôtes de métadonnées, liste blanche CIDR optionnelle).
2. **Avant la connexion** — le nom d'hôte est résolu en IP et **l'adresse résolue** est vérifiée avec les mêmes règles.

Cela comble les failles de DNS rebinding où un nom d'hôte public se résout ensuite en IP privée ou de métadonnées.

## Vérification SSH à l'enregistrement

La création ou la mise à jour d'un serveur (changement d'hôte, de port ou d'identité) exécute automatiquement un **test de connexion SSH à l'envoi**. Il n'y a pas de bouton de test séparé — l'enregistrement est bloqué tant que la vérification n'a pas réussi.

Lors de la première vérification réussie, l'empreinte de la clé hôte est enregistrée et le serveur est marqué **Vérifié**.

## Épinglage de clé hôte SSH

| État | Signification |
|------|---------------|
| **Vérifié** | Clé enregistrée après enregistrement réussi à la création/mise à jour ou **Actualiser le statut** |
| **Non vérifié** | Clé importée depuis la configuration — exécuter **Actualiser le statut** sur le tableau de bord du serveur pour vérifier |

La page de modification affiche l'empreinte et un avertissement non vérifié le cas échéant, mais n'exécute pas la vérification tant que vous n'enregistrez pas des paramètres de connexion modifiés ou n'utilisez pas **Actualiser le statut** sur le tableau de bord.

Si la clé hôte distante change (réinstallation, MITM), la connexion suivante échoue jusqu'à investigation.

## Effet de la suppression d'un serveur

La suppression d'un serveur retire **uniquement les données locales** :

- Règles brouillon, snapshots, sessions d'application, historique des opérations pour ce serveur

Elle **ne modifie pas** les règles UFW sur l'hôte Linux distant. L'état du pare-feu distant reste inchangé.

## Cycle de vie UFW sur un serveur

Depuis le tableau de bord du serveur, vous pouvez :

1. **Actualiser le statut** — détecter si UFW est installé et actif (utilise le snapshot en cache jusqu'à l'actualisation)
2. **Installer UFW** si absent — l'installation et l'activation s'exécutent ensemble en une seule opération
3. Modifier et appliquer les règles lorsque UFW est installé **et** actif

L'édition des règles n'est disponible que lorsque UFW est installé **et** actif.

## Documentation associée

- [Identités SSH](./ssh-identities.md)
- [Gérer les serveurs](../user-guide/manage-servers.md)
- [Dépannage](../troubleshooting.md)
