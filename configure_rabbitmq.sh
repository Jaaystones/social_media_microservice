#!/bin/bash

# Linux script to install erlang and rabbitmq-server for message broker
# Update system
sudo apt update && sudo apt upgrade -y

# Add the erlang repository
sudo apt install -y curl gnupg2
curl -fsSL https://packages.erlang-solutions.com/ubuntu/erlang_solutions.asc | sudo tee /etc/apt/trusted.gpg.d/erlang.gpg > /dev/null
echo "deb https://packages.erlang-solutions.com/ubuntu $(lsb_release -cs) contrib" | sudo tee /etc/apt/sources.list.d/erlang.list

# Install erlang(To check if erlang is running use erl command and q(). command to quit)
sudo apt update
sudo apt install -y erlang

# Install Rabbitmq
# Signup key
curl -fsSL https://packagecloud.io/rabbitmq/rabbitmq-server/gpgkey | sudo tee /etc/apt/trusted.gpg.d/rabbitmq.gpg > /dev/null

# Add the repository
sudo tee /etc/apt/sources.list.d/rabbitmq.list <<EOF
deb https://packagecloud.io/rabbitmq/rabbitmq-server/ubuntu/ $(lsb_release -cs) main
EOF

# Install Rabbitmq
sudo apt install -y rabbitmq-server

# Enable and start server
sudo systemctl enable rabbitmq-server
sudo systemctl start rabbitmq-server
sudo systemctl status rabbitmq-server

# Configure plugins and management then restart server
sudo rabbitmq-plugins enable rabbitmq_management
sudo systemctl restart rabbitmq-server
sudo systemctl status rabbitmq-server
