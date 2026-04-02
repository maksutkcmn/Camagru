FROM busybox:1.36

WORKDIR /var/www

COPY index.html .
COPY favicon.svg .
COPY css/ ./css/
COPY js/ ./js/

EXPOSE 80

CMD ["busybox", "httpd", "-f", "-v", "-p", "80"]
