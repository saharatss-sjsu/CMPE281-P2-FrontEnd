#!/bin/bash
cd $(dirname "$0")
npm run build
cp cmpe281_frontend.service ../build/cmpe281_frontend.service
zip -r server_frontend.zip ../build

