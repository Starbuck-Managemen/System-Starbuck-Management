#!/bin/bash
set -e

echo "Extracting project..."
mkdir -p bucknet-manager-v2
tar -xzf bucknet-manager.tar.gz -C bucknet-manager-v2
cd bucknet-manager-v2

echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx

echo "Installing PM2..."
sudo npm install -g pm2

echo "Installing dependencies..."
npm install

echo "Generating Prisma client..."
npx prisma generate

echo "Building project..."
npm run build

echo "Starting PM2..."
pm2 start npm --name "bucknet-manager" -- start
pm2 save
sudo pm2 startup systemd -u Kiki --hp /home/Kiki || true

echo "Configuring Nginx..."
sudo bash -c 'cat > /etc/nginx/sites-available/default <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF'

sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "Setup completed successfully!"
