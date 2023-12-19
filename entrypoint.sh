#!/bin/sh

echo "add host.docker.internal to hosts"

ip -4 route list match 0/0 | awk '{print $3 " host.docker.internal"}' >> /etc/hosts  

/usr/local/bin/npm run start:docker 