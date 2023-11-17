#!/bin/bash
cd $(dirname "$0")
npm run build
zip -r server_frontend.zip ../build

