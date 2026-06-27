# Serveurs et SSH

Un enregistrement **serveur** représente un hôte Linux que vous gérez. L'application se connecte via SSH pour exécuter des commandes UFW et lire l'état du pare-feu.

## Champs du serveur

| Champ | Rôle |
|-------|------|
| **Nom** | Libellé affiché dans la barre latérale |
| **Hôte** | Adresse IP ou nom DNS (validé avant enregistrement) |
| **Port** | Port SSH (22 par défaut) |
| **Identité SSH** | Identifiants utilisés pour la connexion |

## Validation de l'hôte (protection SSRF)

Avant qu'un serveur soit enregistré, l'hôte est validé :

- Les plages IP privées (10.x, 172.16–31, 192.168.x) sont **bloquées** par défaut
- Les adresses link-local et métadonnées cloud sont bloquées
- Les adresses IPv6 mappées IPv4 privées sont bloquées
- Liste blanche optionnelle : définir `SSH_ALLOWED_CIDRS` dans `.env` (ex. `10.0.0.0/8`) pour les réseaux internes

Cela empêche l'application d'être utilisée comme proxy pour scanner les réseaux internes.

## Vérification de résolution DNS

La validation se fait en deux étapes :

1. **À l'enregistrement** — la chaîne du nom d'hôte est vérifiée (littéraux privés, hôtes métadonnées, liste blanche CIDR optionnelle).
2. **Avant connexion** — le nom d'hôte est résolu en IP et **l'adresse résolue** est vérifiée avec les mêmes règles.

Cela ferme les failles de DNS rebinding où un nom d'hôte public se résout ensuite en IP privée ou métadonnée.

## Test SSH avant enregistrement

La création ou la mise à jour d'un serveur (hôte, port ou changement d'identité) exige un **test de connexion SSH** réussi. L'interface bloque l'enregistrement tant que le test n'a pas réussi.

## Épinglage de la clé hôte SSH

Lors de la première connexion réussie, l'empreinte de la clé hôte SSH du serveur est enregistrée.

| État | Signification |
|------|---------------|
| **Vérifié** | Clé enregistrée après test SSH réussi ou opération normale |
| **Non vérifié** | Clé importée depuis un fichier de configuration — exécuter le test SSH pour vérifier |

Si la clé hôte distante change (réinstallation, MITM), la connexion suivante échoue jusqu'à investigation.

## Effet de la suppression d'un serveur

Supprimer un serveur retire **uniquement** les données locales :

- Règles brouillon, snapshots, sessions d'application, historique des opérations pour ce serveur

Cela ne **modifie pas** les règles UFW sur l'hôte Linux distant. L'état du pare-feu distant reste inchangé.

## Cycle de vie UFW sur un serveur

Depuis le tableau de bord serveur, vous pouvez :

1. **Détecter** UFW — installé ? actif ?
2. **Installer** UFW s'il est absent
3. **Activer** UFW et synchroniser les règles

L'édition des règles n'est disponible que lorsque UFW est installé **et** actif.

## Documentation associée

- [Identités SSH](./ssh-identities.md)
- [Gérer les serveurs](../user-guide/manage-servers.md)
- [Dépannage](../troubleshooting.md)
