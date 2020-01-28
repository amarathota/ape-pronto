#!/bin/bash

set -e

cat <<EOF> ~/.npmrc
registry=http://timeinc.artifactoryonline.com/timeinc/api/npm/npm
_auth = $ARTIFACTORY_NPM_AUTH
email = noreply@timeinc.com
always-auth = true
EOF
