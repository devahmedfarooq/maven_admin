FROM node:20.12.0-alpine 
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install 

COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "run", "start"]