docker stop signicat-poc
docker container prune -f
docker build . -t wh-poc-signicat
docker container run --name signicat-poc -d -p $1:5000 --env-file ./.env wh-poc-signicat 
