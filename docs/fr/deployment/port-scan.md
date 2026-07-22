# Scan externe de ports (déploiement)

Les administrateurs activent le scan externe de ports via les variables d'environnement. Usage utilisateur : [Scan de ports (guide utilisateur)](../user-guide/port-scan.md).

## Ce qu'il fait

Depuis le conteneur **ufw-app**, l'application scanne l'adresse `host` de chaque serveur enregistré :

1. **Naabu** — découverte TCP ports 1–65535
2. **Nmap** — détection de service sur les ports découverts

Résultats stockés dans Postgres et affichés sur la page serveur. **Aucun SSH** n'est utilisé pour le scan.

## Activer

```env
PORT_SCAN_ENABLED=true
```

Redémarrer le conteneur app après modification. L'image doit inclure Naabu et Nmap (Dockerfile officiel le fait).

## Réglages optionnels

| Variable | Défaut | Rôle |
|----------|--------|------|
| `PORT_SCAN_MAX_NMAP_PORTS` | `500` | Plafonner les ports envoyés à Nmap |
| `PORT_SCAN_NAABU_TIMEOUT_MS` | `1800000` | Timeout découverte (30 min) |
| `PORT_SCAN_NMAP_TIMEOUT_MS` | `600000` | Timeout enrichissement (10 min) |
| `PORT_SCAN_HISTORY_LIMIT` | `10` | Scans conservés par serveur |

## Exigences réseau

Le conteneur app doit atteindre les **hôtes serveurs gérés sur les ports TCP scannés**, pas seulement SSH `:22`. Autoriser la sortie depuis l'hôte Docker (ou réseau app) vers les serveurs cibles.

Seuls les **hôtes serveurs enregistrés** sont scannés — cibles arbitraires rejetées.

## Concurrence (v0.9.2)

| Sujet | Comportement |
|-------|--------------|
| File SSH | Le scan de ports **n'utilise pas** la file SSH par serveur — actualisation/application UFW non bloquées pendant 30+ min |
| Chevauchement | Un seul scan PENDING/RUNNING par serveur ; second démarrage rejeté |
| Limite de débit | 30 secondes entre démarrages de scan par serveur (fixe dans le code) |
| SSR | La page serveur charge le dernier scan de **tout statut** — scans en cours reprennent après actualisation |

Les résultats persistent via remplacement atomique (`deleteMany` + `createMany` en une transaction).

## Couverture UFW

Voir [Guide utilisateur scan de ports](../user-guide/port-scan.md#valeurs-de-couverture-ufw) pour la sémantique des colonnes.

## Sécurité

- Audit : `PORT_SCAN_STARTED`, `PORT_SCAN_COMPLETED`
- Scans connect uniquement (`-sT`) — pas de capacités raw socket requises
- Désactivé par défaut

## Documentation associée

- [Variables d'environnement](../administration/environment-variables.md)
- [Architecture](../architecture.md)
- [Opérations et concurrence](../concepts/operations-and-concurrency.md)
