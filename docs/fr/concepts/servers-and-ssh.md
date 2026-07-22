# Serveurs et SSH

Un enregistrement **serveur** stocke le nom d'affichage, l'hôte, le port, l'identité SSH et l'empreinte de clé hôte optionnelle. Tout le travail UFW distant passe par cet enregistrement.

## Validation d'hôte

Avant l'enregistrement, l'application valide l'hôte cible :

| Vérification | Comportement par défaut |
|--------------|-------------------------|
| Plages IP privées | **Rejetées** (RFC1918, loopback, link-local) |
| IP de métadonnées cloud | **Rejetées** |
| Noms d'hôte / IP publics | Autorisés |
| Liste blanche personnalisée | Définir `SSH_ALLOWED_CIDRS` pour autoriser des plages privées spécifiques (lab/VPN) |

La résolution DNS est validée le cas échéant pour que les fautes de frappe échouent tôt.

## Vérification de connexion

**Créer le serveur** et **Modifier le serveur** (lorsque l'hôte, le port ou l'identité changent) exécutent automatiquement un test de connexion SSH. Il n'y a pas de bouton *Tester la connexion* séparé sur le formulaire de modification.

Les messages d'échec pointent vers l'accessibilité, les identifiants, le pare-feu ou la validation d'hôte — voir [Dépannage](../troubleshooting.md).

## Clés hôte SSH (confiance à la première utilisation)

Lors de la première connexion réussie, l'empreinte de la clé hôte du serveur est stockée et marquée **vérifiée**.

| État | Interface | Application des règles |
|------|-----------|------------------------|
| **Vérifiée** | Empreinte affichée sur la page de modification | Autorisée après actualisation |
| **Non vérifiée** | Avertissement sur le tableau de bord et la page de modification | **Enregistrer les règles** (application) bloquée jusqu'à ce que **Actualiser le statut** réussisse |

Cela réduit le risque MITM à la première connexion. Pour faire confiance à une nouvelle clé après reconstruction du serveur, mettez à jour le serveur ou effacez et revérifiez via actualisation.

Les serveurs importés depuis la configuration peuvent arriver avec des empreintes stockées — vérifiez avec **Actualiser le statut** avant d'appliquer les règles.

## Sudo et UFW

Les commandes distantes supposent que l'utilisateur SSH peut exécuter `ufw` — typiquement via sudo sans mot de passe pour `ufw` ou root. L'application encapsule les commandes apt install dans `sudo` si nécessaire pour **Installer UFW**.

Assurez-vous que `/etc/sudoers` autorise les commandes requises pour l'utilisateur choisi.

## Serveurs en double

La même combinaison hôte + port + identité ne peut pas être enregistrée deux fois. Utilisez des noms distincts si vous gérez intentionnellement le même hôte via différents comptes (identités différentes).

## Documentation associée

- [Identités SSH](./ssh-identities.md)
- [Gérer les serveurs](../user-guide/manage-servers.md)
- [Variables d'environnement](../administration/environment-variables.md) — `SSH_ALLOWED_CIDRS`
