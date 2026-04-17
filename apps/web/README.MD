ubuntu@vps-78d51219:~/FinanceFlowWeb$ which nginx  
/usr/sbin/nginx  

je suis actuellement sure ledist du projectweb   
donner next etape


Je te donne la suite exacte depuis le serveur Ubuntu.
Checklist
 Copier le contenu de dist dans /var/www/financeflow
 Créer la config Nginx
 Activer le site
 Tester Nginx
 Ouvrir le front sur l’IP
Comme ton web est un Vite + React (apps/web/package.json) et que le routage utilise createBrowserRouter (apps/web/src/app/router.tsx), il faut absolument une règle try_files ... /index.html;.

1) Copier dist vers le dossier web
Si tu es déjà dans le dossier dist

sudo mkdir -p /var/www/financeflow
sudo cp -r ./* /var/www/financeflow/


Si tu es à la racine ~/FinanceFlowWeb

sudo mkdir -p /var/www/financeflow
sudo cp -r ~/FinanceFlowWeb/dist/* /var/www/financeflow/

ls /var/www/financeflow
Tu dois voir au minimum index.html + assets/.

2) Créer la config Nginx
sudo nano /etc/nginx/sites-available/financeflow

Colle ça :
server {
    listen 80;
    server_name 51.75.24.113;

    root /var/www/financeflow;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:1334/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:1334/uploads/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

Important
Les blocs /api/ et /uploads/ sont à garder seulement si ton backend Strapi tourne aussi sur ce serveur en 127.0.0.1:1334.


Sinon, utilise cette version plus simple :

server {
    listen 80;
    server_name 51.75.24.113;

    root /var/www/financeflow;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

3) Activer le site
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/financeflow /etc/nginx/sites-enabled/financeflow

4) Tester et recharger Nginx
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl enable nginx

Vérifie aussi qu’il tourne :
sudo systemctl status nginx --no-pager
5) Ouvrir le site
Dans le navigateur :
http://51.75.24.113

Si le front s’ouvre mais l’API ne marche pas
Dans ton projet, l’URL API est injectée au build dans apps/web/vite.config.ts et utilisée dans apps/web/src/services/api/client.ts.
Donc si tu as build avec une mauvaise URL API, Nginx seul ne suffit pas, il faut rebuild le front avec la bonne variable :
Cas 1 — API directe sur port 1334

API_BASE_URL=http://51.75.24.113:1334 npm run build

Cas 2 — API derrière Nginx via /api (recommandé)
API_BASE_URL=http://51.75.24.113 npm run build

Puis recopier dist.
----------------------------------------------------------------------------------------------------------------------
Commandes minimales à exécuter maintenant
Si tu veux aller vite, fais juste ça :
sudo mkdir -p /var/www/financeflow
sudo cp -r ./* /var/www/financeflow/
sudo nano /etc/nginx/sites-available/financeflow
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/financeflow /etc/nginx/sites-enabled/financeflow
sudo nginx -t
sudo systemctl reload nginx

Vérification rapide
Teste depuis le serveur :
curl http://127.0.0.1

Si Nginx sert bien le front, tu devrais voir du HTML avec index.html.

Si tu veux, je peux maintenant te donner la config exacte finale selon ton cas :
1 front seul
2 front + Strapi sur le même VPS
3 front + domaine + HTTPS


pour faire une mise à jour : 

1 palcer sure le fichier /FinanceFlowWeb
2 sudo rm -rf /var/www/financeflow/*
3 sudo cp -r ./* /var/www/financeflow/

4 sudo systemctl reload nginx