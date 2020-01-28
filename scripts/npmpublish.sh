#!/bin/bash

set -e

git config --global push.default matching
git config user.name "circleci"
git config user.email "ape-service-circleci@eric.spoon16.com"

npm version patch -m "bump to %s [ci skip]"

# this will only work if build is configured to use ape-service-circleci user key in circleci project settings
# default key is readonly so will fail if you don't override with user key
git push

npm publish
