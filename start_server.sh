#!/bin/bash
export PATH=$PATH:/usr/local/bin:/opt/homebrew/bin
echo "Starting server..." > server_debug.log
which npm >> server_debug.log
npm run dev >> server_debug.log 2>&1 &
echo $! > server.pid
echo "Server process started with PID $(cat server.pid)" >> server_debug.log
