# Node.js Gyazo Server
Simple HTTP server for recieving and manipulate of uploaded images

# Installation
Use GIT for cloning this repository and install all required NPM packages
```
git clone git@github.com:akazakou/node-gyazo-server.git
cd node-gyazo-server.git
npm install
```
Then you need create MySQL database and upload there step by step all SQL files from ./migrations directory, like: 0001_initdb.sql, 0002_images.sql and etc.

# Configuration
I have use [Config](https://www.npmjs.com/package/config) NPM package. That allow you create *local.json* configuration file, copied from *default.json* and place it in **./config** directory and that file will owerwrite default settings from default config.

## Server section
This section contain all options for configurate your HTTP server. 

`cluster` (boolean) - run HTTP server as cluster or not. Cluster mode means, that you can run one controll proccess and by one proccess on every availible proccessor core. That option allow increase productivity of your HTTP server in times.

`port` (integer) - port number, where is HTTP serv will be run

`maxSockets` (integer) - maximum number of availible sockets on the HTTP server. That means only *maxSockets* requests from users can be availible in one time.

`timezone` (string) - timezone name like "Europe/Minsk". Full list of availible timezones you can find in [Moment.js](http://momentjs.com/timezone/docs/#/data-loading/getting-zone-names/) documentation

`session` (object) - right now contain only one setting option `secretKey` - this is secret key for generate unique user hashes. User hash, it is secret key generated for every new browser. That key allow us identificate owner of current image.

## Upload section
Section contain configuration for uploaded images

`directory` (string) - path to your uploaded files storage. Please use full path for this option

`url` (string) - URL where will be publish every uploaded image  

`imageUrl` (string) - URL of image, where it will be published

## Services section
This section contain information about configuration all of used services. Every service contain some count of equal named options. That needs for ServiceLoader module for configuration proccess of initialization every service.

### Logs
Service for manage your logs. Contain information about all requests to your HTTP server and about all errors, that happens in working proccess.

*Initialization timeout: 50 milliseconds, Used library: Logger. Availible options:*

`logs.access.path` (string) - path to your access log. Log use [Winston](https://www.npmjs.com/package/winston) logger and configurated for daily rotation.

`logs.access.level` (string) - level of messages, that must be in log file and can have some from one of values: emerg, alert, crit, error, warning, notice, info or debug

`logs.error.path` (string) - path to your error log. Log use [Winston](https://www.npmjs.com/package/winston) logger and configurated for daily rotation.

`logs.error.level` (string) - level of messages, that must be in log file and can have some from one of values: emerg, alert, crit, error, warning, notice, info or debug

### Database
Service allow make MySQL request to the database. Also this service contain basic business logic for find and delete old images.

Initialization timeout: 1500 milliseconds, Used library: MySQLDatabase, Depends from services: Logs. Availible options:

`connection.host` (string) - host of your MySQL database

`connection.port` (integer) - port of your MySQL database

`connection.user` (string) - username for accessing to your database

`connection.password` (string) - password for accessing to your database

`connection.database` (string) - your database name

`connection.connectTimeout` (integer) - connection timeout in milleseconds for you database.

`connection.connectLimit` (string) - limit of connections availible to your database at the same time

### ManagerImages
This service contain main logic for manipulation of image files. Allow us upload, save, delete and recieve infomation about images. 

Initialization timeout: 1500 milliseconds, Used library: ImagesManager, Depends from services: Logs, Database. Availible options:

`table` (string) - table in database, where contained information about images

`limit` (integer) - how many images per time service can proccess for every iteration

### Cron
Service for pereodical tasks. Main task for this service is find and delete ol images. 

Initialization timeout: 1500 milliseconds, Used library: Cron, Depends from services: Logs, Database. Availible options:

`periodTime` (integer) - period in milliseconds for every task iteration. Default is: 10000

`defaultLifetime` (integer) - default lifetime of new image in seconds. Default is: 3600

# Example of nginx configuration

You can use this HTTP server not only as IP adress and port. Also some times you need create your own domain name for this server. In this can helps next nginx configuration file. For example, i use my demo web server placed on gyazo.kantora.pro domain

```nginx
upstream gyazo_node_server {
    server 127.0.0.1:3001;
    keepalive 8;
}

server {
    server_name gyazo.kantora.pro;
    root /home/nginx/gyazo.kantora.pro/public;

    access_log /var/log/nginx/gyazo.access.log;
    error_log /var/log/nginx/gyazo.error.log;

    location ~* ^.+\.(jpg|jpeg|gif|png|ico|css|pdf|ppt|txt|bmp|rtf|js|swf|woff|woff2|ttf|eot|svg|html|ico)$ {
        access_log off;
        expires max;
    }

    location / {
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header Host $http_host;
      proxy_set_header X-NginX-Proxy true;

      proxy_pass http://gyazo_node_server/;
      proxy_redirect off;
    }
}
```

# Run server
I recommend use forever package for demonize your web server. This command can help you correctly run the server for forever daemon control service.
```
NODE_CONFIG_DIR=/path/to/server/node-gyazo-server.git/config forever start /path/to/server/node-gyazo-server.git/server.js
```

# How to use it
For Ubuntu users can help nex bash script for create and take screenshot to the server. For example, i use my demo web server placed on gyazo.kantora.pro domain

```bash
#!/bin/sh

IMG=$(mktemp -t imgshareXXX)
gnome-screenshot -a --file=${IMG}

URL="http://gyazo.kantora.pro/upload.cgi"
UserAgent='Gyazo/1.0'

RESULT=$(curl -i -F id="" -F imagedata=@"${IMG}" -A "$UserAgent" "$URL")

if [ $? -ne 0 ]; then
    echo "Something went wrong;("
    exit 1
fi

IMGURL=`echo "${RESULT}" | tail -n 1`

echo -n ${IMGURL} | xclip
xdg-open ${IMGURL}

rm ${IMG}
```