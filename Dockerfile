FROM node:10
RUN apt-get update

ENV HOME_DIR /usr/src/app

# for https
RUN apt-get install -yyq ca-certificates

# install libraries
RUN apt-get install -yyq libappindicator1 libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6

# tools
RUN apt-get install -yyq gconf-service lsb-release wget xdg-utils

# and fonts
RUN apt-get install -yyq fonts-liberation

RUN mkdir -p $HOME_DIR
RUN mkdir -p $HOME_DIR/views

WORKDIR $HOME_DIR

# Add our package.json and install *before* adding our application files to
# optimize build performance
ADD package.json $HOME_DIR
ADD package-lock.json $HOME_DIR

# install the necessary packages
RUN npm install --unsafe-perm --save-exact --production
COPY . $HOME_DIR
RUN npm run clean && npm run build

ENTRYPOINT ["/usr/local/bin/npm", "run"]
CMD ["clean"]