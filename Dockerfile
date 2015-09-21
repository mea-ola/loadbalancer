FROM debian
MAINTAINER Michael Timbrook <michael@timbrook.im>

# this will handle unarchiving! no tar xzf needed
ADD https://github.com/nginx/nginx/archive/release-1.9.4.tar.gz /buildnginx/ngnix.tar.gz
RUN tar -xvf /buildnginx/ngnix.tar.gz -C /buildnginx
ADD misc/nginx_accesskey-2.0.3.tar.gz /accesskey
ADD misc/config_accesskey /accesskey/nginx-accesskey-2.0.3/config

RUN apt-get update -y
RUN apt-get install -y build-essential libpcre3 libpcre3-dev zlib1g zlib1g-dev openssl libssl-dev curl
RUN curl --silent --location https://deb.nodesource.com/setup_0.12 | bash -
RUN apt-get install -y nodejs

WORKDIR /buildnginx/nginx-release-1.9.4
RUN export HTTP_ACCESSKEY_MODULE=ngx_http_accesskey_module
RUN auto/configure \
	--add-module=/accesskey/nginx-accesskey-2.0.3/ \
	--with-http_ssl_module \
	--with-http_spdy_module \
	--without-mail_pop3_module \
	--without-mail_smtp_module \
	--without-mail_imap_module \
	--with-ipv6
RUN make && make install
RUN mkdir -p /nginx/logs

#### Build Finished
RUN mkdir -p /tmp/ssl
ADD misc/devssl.cnf /tmp/ssl/openssl.cnf
WORKDIR /tmp/ssl
RUN openssl req \
  -new \
  -newkey rsa:2048 \
  -sha1 \
  -days 3650 \
  -nodes \
  -x509 \
  -keyout ssl.key \
  -out ssl.crt \
  -config openssl.cnf

RUN mv ssl.key /etc/ssl/ssl.key
RUN mv ssl.crt /etc/ssl/ssl.crt

COPY ./src /event/
WORKDIR /event
RUN npm install

COPY ./startup.sh /startup.sh

EXPOSE 80
EXPOSE 443
# 3000 is for marathon event subscription
EXPOSE 3000

ENTRYPOINT "/startup.sh"
