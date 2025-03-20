FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Create .env file with necessary environment variables
RUN echo "PUBLIC_KEY=HACMTSR37NBTFSS1Z1WFAS98CX8FK4" > .env && \
    echo "SECRET_KEY=CF895M8RXZJE2QG3H5JAQ7HPEU1ERV" >> .env && \
    echo "MONGODB_URI=mongodb://mongo:27017/purple-pay" >> .env

RUN npm run build

EXPOSE 9876

CMD ["npm", "start"]
