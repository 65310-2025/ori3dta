#! /bin/bash
set -xe

cd client
npx tsc --noEmit

cd ../server
npx tsc --noEmit

cd ..
npx eslint .
npx prettier --check .
