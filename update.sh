#!/bin/bash
cd /var/www/storysight || exit

echo "Pulling latest changes..." >> update.log 2>&1
git pull origin main >> update.log 2>&1

echo "Installing dependencies for backend..." >> update.log 2>&1
cd backend || exit
./venv/bin/pip install -r requirements.txt >> ../update.log 2>&1

echo "Installing dependencies for frontend..." >> ../update.log 2>&1
cd ../
npm install >> update.log 2>&1
npm run build >> update.log 2>&1

echo "Restarting services..." >> update.log 2>&1
systemctl restart backend >> update.log 2>&1
systemctl restart frontend >> update.log 2>&1

echo "Update complete." >> update.log 2>&1
