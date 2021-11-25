FROM node:16

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

#should match the PORT in .env
EXPOSE 5000
CMD [ "npm", "start" ]