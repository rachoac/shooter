set -xe
cd client
npm install
npm run build
cd -

if [ ! -d target ]; then
	mkdir target
fi 

cp -R client/* target/.
