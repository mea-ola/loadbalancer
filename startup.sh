#!/bin/bash
cd /event
npm start & 
sleep 5
mkdir -p /nginx/conf/
curl localhost:3000 > /nginx/conf/nginx.conf
/usr/local/nginx/sbin/nginx -p /nginx/ -c conf/nginx.conf
