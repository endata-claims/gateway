FROM node:12.13

WORKDIR /root/app 

COPY ./package.json ./package.json

RUN yarn

COPY . .
RUN yarn global add nodemon

ENTRYPOINT yarn dev
