# GemQuest

## Liens

[`dApp GemQuest`](https://gemquest-pi.vercel.app/)

[`Program`](https://explorer.solana.com/address/4MUuZnYgakTqerEBjsD783s4QP2trwyy2KWZ9SXJdffZ?ref=alphasec.io&cluster=devnet)

[`Le Readme du front_end`](https://github.com/Crypt0zauruS/gemquest/tree/master/frontend/README.md)


## Présentation du projet

GemQuest est une application décentralisée (DApp) basée sur la blockchain Solana, conçue pour offrir une expérience interactive centrée sur la gestion de tokens et l'échange de NFTs. Les utilisateurs peuvent participer à des quizz interactifs, gagner des tokens, et les utiliser pour acheter des NFTs uniques dans une marketplace intégrée. L'application combine des éléments de jeu avec des transactions blockchain pour créer une plateforme immersive et engageante.

Voici un résumé du diagramme de séquence disponnible dans la partie

```mermaid
    sequenceDiagram
        Frontend->>+Web3Auth: Authentication
        Web3Auth-->>-Frontend: User Public Key
        Frontend->>+Program: Get/Update (data)
        Program-->>-Frontend: NFT list, token balance
        Program-->>+ Program : Burn Token
        Frontend->>+Openai: QRcode scan
        Openai-->>-Frontend: Quizz generated
```

## Aperçu de l'application

<img src="https://github.com/user-attachments/assets/3f46e9df-6903-4a2d-9d15-f51ae0e7efa5" width="18%">
<img src="https://github.com/user-attachments/assets/99817a76-ed14-408b-a8ec-65d8c363b478" width="18%">
<img src="https://github.com/user-attachments/assets/1d024439-e164-4007-8d25-cfc570d61b71" width="18%">
<img src="https://github.com/user-attachments/assets/08127372-78fe-417a-8488-dafec383293d" width="18%">
<img src="https://github.com/user-attachments/assets/17c3ff46-a70f-4b14-82bb-16b876cd4864" width="18%">
<img src="https://github.com/user-attachments/assets/e1664e94-57b2-45c6-a5f3-ca25723167c6" width="18%">
<img src="https://github.com/user-attachments/assets/86d307cc-ec85-4890-b2ad-6a864b8dd8f1" width="18%">



## Technologies utilisées

### Back-End (Blockchain) 🔗 : [`Link Here`](https://github.com/Crypt0zauruS/gemquest/tree/master/programs/gemquest)

Le back-end de GemQuest est construit sur la blockchain **Solana** et utilise le framework **Anchor** pour faciliter le développement de programmes. Anchor permet de gérer de manière robuste et sécurisée les interactions avec la blockchain, incluant la création de tokens, la gestion des NFTs, et les mécanismes de récompense et d'échange :

- **Solana Blockchain** : Fournit une infrastructure rapide et à faible coût pour les transactions décentralisées.
- **Anchor Framework** : Simplifie le développement de programme sur Solana en fournissant des outils et des abstractions de haut niveau.

### Front-End 🔗 : [`Link Here`](https://github.com/Crypt0zauruS/gemquest/tree/master/frontend)

Le front-end de GemQuest est développé avec **React** et **Next.js**. Il utilise les librairie **Web3Auth** pet l'api **OpenAi** offrant une interface utilisateur réactive et optimisée pour une performance élevée :

- **React** : Utilisé pour construire une interface utilisateur dynamique et réactive, avec des composants modulaires et réutilisables.
- **Next.js** : Framework React qui permet le rendu côté serveur pour une meilleure performance et une optimisation SEO. Facilite également le routage et l'intégration API.
- **Web3Auth** : Assure une authentification sécurisée et sans friction.
- **OpenAI** : Génère des quizz interactifs, enrichissant l'expérience utilisateur.

## Installation et configuration

Pour exécuter GemQuest localement, suivez ces étapes :

1. **Clonez le dépôt** :

   ```bash
   git clone https://github.com/Crypt0zauruS/gemquest
   cd gemquest
   ```

2. **Installez les dépendances** :

   - Back-end :

     ```bash
     npm install
     ```

     ou

     ```bash
      yarn install
     ```

   - Front-end :
     ```bash
     cd frontend && npm install
     ```
     ou
     ```bash
     cd frontend && yarn install
     ```

3. **Configurez les variables d'environnement** :

   - Dans le repertoire racine, copiez le fichier `.env.sample` en `.env` et ajustez les variables nécessaires.

   - Dans le repertoire frontend, copiez le fichier `.env.local.sample` en `.env.local` et ajustez les variables nécessaires.

4. **Démarrez les serveurs de développement** :
   - Lancez le serveur Anchor :
     ```bash
     anchor test
     ```
   - Lancez le serveur Next.js :
     ```bash
     npm run dev
     ```
## Tests unitaires

![image](https://github.com/user-attachments/assets/cd012d5f-97e9-46c7-b8b9-c0715c48dc76)

