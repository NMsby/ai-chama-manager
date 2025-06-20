#!/bin/bash

# AI-Powered Chama Manager Setup Script
echo "Setting up AI-Powered Chama Manager development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if DFX is installed
if ! command -v dfx &> /dev/null; then
    echo "DFX is not installed. Please install DFX CLI first."
    exit 1
fi

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend && npm install && cd ..

# Start DFX local network
echo "Starting DFX local network..."
dfx start --background

# Deploy canisters
echo "Deploying canisters..."
dfx deploy

echo "Setup complete! You can now start development."
echo "Run 'npm start' in the frontend directory to start the development server."