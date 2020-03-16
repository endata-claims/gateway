FROM node:12.13

WORKDIR /root/app 

COPY ./package.json ./package.json

RUN yarn

COPY . .

ENTRYPOINT yarn start
