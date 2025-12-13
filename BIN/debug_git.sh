#!/bin/bash
echo "--- GIT STATUS ---" > debug_output.txt
git status >> debug_output.txt 2>&1
echo "--- GIT LOG ---" >> debug_output.txt
git log -1 >> debug_output.txt 2>&1
echo "--- GIT REMOTE ---" >> debug_output.txt
git remote -v >> debug_output.txt 2>&1
