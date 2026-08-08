# Pinterest API Integration Guide

Ce document explique comment configurer et utiliser l'intégration API Pinterest dans PinGen.

## 📋 Prérequis

1. Compte Pinterest Business
2. Application Pinterest Developer
3. OAuth 2.0 configuré

## 🚀 Configuration

### 1. Créer une Application Pinterest

1. Allez sur [Pinterest Developers](https://developers.pinterest.com/)
2. Connectez-vous avec votre compte Pinterest
3. Cliquez sur "Create App"
4. Remplissez les informations:
   - **App Name**: PinGen
   - **App Description**: Pinterest automation tool
   - **Website URL**: https://yourdomain.com

### 2. Configurer OAuth

Dans les paramètres de votre app:

1. Activez **OAuth 2.0**
2. Ajoutez les **Redirect URIs**:
   ```
   http://localhost:5173/auth/pinterest/callback
   https://yourdomain.com/auth/pinterest/callback
   ```
3. Notez votre **App ID** et **App Secret**

### 3. Configurer les Scopes

Assurez-vous d'avoir ces scopes:
- `boards:read` - Lire les tableaux
- `boards:write` - Créer des tableaux
- `pins:read` - Lire les pins
- `pins:write` - Créer des pins
- `user_accounts:read` - Lire le profil utilisateur

### 4. Variables d'Environnement

Ajoutez dans votre `.env`:

```env
VITE_PINTEREST_APP_ID=your-app-id
VITE_PINTEREST_APP_SECRET=your-app-secret
```

## 🔌 Flux d'Authentification

### 1. Générer l'URL d'Authentification

```typescript
import { getPinterestAuthUrl } from '@/lib/pinterest';

const authUrl = getPinterestAuthUrl(
  'https://yourdomain.com/auth/pinterest/callback',
  'optional-state-param'
);

// Rediriger l'utilisateur vers authUrl
window.location.href = authUrl;
```

### 2. Gérer le Callback

Après autorisation, Pinterest redirige vers:

```
https://yourdomain.com/auth/pinterest/callback?code=AUTH_CODE&state=STATE
```

### 3. Échanger le Code contre un Token

```typescript
import { exchangeCodeForToken } from '@/lib/pinterest';

const { access_token, refresh_token, expires_in } = await exchangeCodeForToken(
  'AUTH_CODE',
  'https://yourdomain.com/auth/pinterest/callback'
);

// Sauvegarder dans Supabase
await supabase.from('pinterest_accounts').insert({
  user_id: currentUser.id,
  access_token,
  refresh_token,
  token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
});
```

## 📡 Utilisation de l'API

### Récupérer les Informations Utilisateur

```typescript
import { getPinterestUser } from '@/lib/pinterest';

const user = await getPinterestUser(accessToken);
console.log(user.username, user.follower_count);
```

### Lister les Tableaux

```typescript
import { getPinterestBoards } from '@/lib/pinterest';

const boards = await getPinterestBoards(accessToken);
boards.forEach(board => {
  console.log(board.name, board.pin_count);
});
```

### Créer un Tableau

```typescript
import { createPinterestBoard } from '@/lib/pinterest';

const board = await createPinterestBoard(
  accessToken,
  'Mon Nouveau Tableau',
  'Description du tableau'
);
```

### Créer un Pin

```typescript
import { createPinterestPin } from '@/lib/pinterest';

const pin = await createPinterestPin(accessToken, {
  title: 'Titre du Pin',
  description: 'Description optimisée SEO',
  link: 'https://votresite.com/article',
  board_id: 'board-id-123',
  image_url: 'https://votresite.com/image.jpg',
  alt_text: 'Description accessible',
});
```

### Récupérer les Analytics d'un Pin

```typescript
import { getPinAnalytics } from '@/lib/pinterest';

const analytics = await getPinAnalytics(accessToken, 'pin-id-123');
console.log(analytics.impressions, analytics.saves);
```

## 🔄 Rafraîchir le Token

Les tokens d'accès expirent. Utilisez le refresh token:

```typescript
import { refreshPinterestToken } from '@/lib/pinterest';

const { access_token, expires_in } = await refreshPinterestToken(refreshToken);

// Mettre à jour dans la base de données
await supabase
  .from('pinterest_accounts')
  .update({
    access_token,
    token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
  })
  .eq('id', accountId);
```

## 📊 Limites de l'API

| Endpoint | Limite |
|----------|--------|
| Création de Pin | 1000/jour |
| Lecture de données | 1000/heure |
| Analytics | 100/jour |

## 🐛 Dépannage

### Erreur: "invalid_redirect_uri"
- Vérifiez que l'URI de redirection correspond exactement à celle configurée
- Incluez le port si nécessaire (ex: `:5173`)

### Erreur: "insufficient_permissions"
- Vérifiez les scopes demandés
- Demandez à l'utilisateur de réautoriser avec les bons scopes

### Erreur: "token_expired"
- Rafraîchissez le token avec `refreshPinterestToken()`

### Erreur: "rate_limit_exceeded"
- Attendez avant de faire de nouvelles requêtes
- Implémentez un système de retry avec backoff

## 📚 Ressources

- [Documentation Pinterest API v5](https://developers.pinterest.com/docs/api/v5/)
- [Guide OAuth 2.0 Pinterest](https://developers.pinterest.com/docs/getting-started/authentication/)
- [Console Developer](https://developers.pinterest.com/apps/)

## 💡 Bonnes Pratiques

1. **Stockez les tokens de façon sécurisée** (jamais côté client)
2. **Rafraîchissez les tokens avant expiration**
3. **Gérez les erreurs de rate limiting**
4. **Loggez les erreurs pour le débogage**
5. **Testez en environnement sandbox d'abord**
