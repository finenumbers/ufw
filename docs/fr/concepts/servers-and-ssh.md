# Serveurs et SSH

Un enregistrement **serveur** représente un hôte Linux que vous gérez. L'application se connecte via SSH pour exécuter des commandes UFW et lire l'état du pare-feu.

## Champs du serveur

| Champ | Rôle |
|-------|------|
| **Nom** | Libellé affiché dans la barre latérale |
| **Hôte** | Adresse IP ou nom DNS (validé avant l'enregistrement) |
| **Port** | Port SSH (22 par défaut) |
| **Identité SSH** | Identifiants utilisés pour la connexion |

## Validation de l'hôte (protection SSRF)

Avant l'enregistrement d'un serveur, l'hôte est validé :

- Les plages IP privées (10.x, 172.16–31, 192.168.x) sont **bloquées** par défaut
- Les adresses link-local et métadonnées cloud sont bloquées
- Les adresses IPv6 privées mappées IPv4 sont bloquées
- Liste blanche optionnelle : définir `SSH_ALLOWED_CIDRS` dans `.env` (ex. `10.0.0.0/8`) pour les réseaux internes

Cela empêche l'application d'être utilisée comme proxy pour scanner les réseaux internes.

## Test SSH avant l'enregistrement

La création ou la modification d'un serveur (hôte, port ou changement d'identité) nécessite un **test de connexion SSH** réussi. L'interface bloque l'enregistrement tant que le test n'a pas réussi.

## Épinglage de la clé hôte SSH

Lors de la première connexion réussie, l'empreinte de la clé hôte SSH du serveur est enregistrée.

| État | Signification |
|------|---------------|
| **Vérifiée** | Clé enregistrée après un test SSH réussi ou une opération normale |
| **Non vérifiée** | Clé importée depuis un fichier de configuration — lancer un test SSH pour vérifier |

Si la clé hôte distante change (réinstallation, MITM), la connexion suivante échoue jusqu'à investigation.

## Effet de la suppression d'un serveur

La suppression d'un serveur retire **uniquement** les données locales :

- Brouillons de règles, snapshots, sessions d'application, historique des opérations pour ce serveur

Cela ne **modifie pas** les règles UFW sur l'hôte Linux distant. L'état du pare-feu distant reste inchangé.

## Cycle de vie UFW sur un serveur

Depuis le tableau de bord du serveur, vous pouvez :

1. **Détecter** UFW — installé ? actif ?
2. **Installer** UFW s'il est absent
3. **Activer** UFW et synchroniser les règles

L'édition des règles n'est disponible que lorsque UFW est installé **et** actif.

## Documentation associée

- [Identités SSH](./ssh-identities.md)
- [Gérer les serveurs](../user-guide/manage-servers.md)
- [Dépannage](../troubleshooting.md)
