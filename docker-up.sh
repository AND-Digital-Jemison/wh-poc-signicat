docker stop signicat-poc
docker container prune -f

cp .env .temp-env
echo "PUBLISHED_PORT=$1" >> .temp-env
cat .temp-env
docker build . -t wh-poc-signicat
docker container run --name signicat-poc -d -p $1:5000 --env-file ./.temp-env wh-poc-signicat
rm -rf .temp-env