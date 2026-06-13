# Deployer Ile des Ombres

Le jeu est pret pour un hebergement public avec Node.js.

## Option simple avec Render

1. Mets ce dossier dans un depot GitHub.
2. Va sur Render, puis cree un nouveau `Web Service`.
3. Connecte le depot GitHub.
4. Render detectera `render.yaml`.
5. Lance le deploiement.

Le lien public final ressemblera a:

`https://ile-des-ombres.onrender.com`

## Option Railway

1. Cree un projet Railway depuis le depot GitHub.
2. Railway detecte `package.json`.
3. La commande de lancement est:

`npm start`

## Important

Les salons en ligne sont gardes en memoire par le serveur.
Si l'hebergeur redemarre le serveur, les salons en cours disparaissent.
C'est normal pour cette version simple.

Pour garder les parties meme apres redemarrage, il faudra ajouter une petite base de donnees plus tard.
