export GOPATH=`pwd`/service
cd service/src/shooter
glide install
go build -v
cd -

if [ ! -d target ]; then
	mkdir target
fi

cp -f service/src/shooter/shooter target/.

