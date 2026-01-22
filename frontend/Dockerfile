# Frontend Dockerfile - Vanilla JS with BusyBox httpd
FROM busybox:1.36

# Create directory for static files
WORKDIR /var/www

# Copy static files
COPY index.html .
COPY css/ ./css/
COPY js/ ./js/
COPY assets/ ./assets/

EXPOSE 80

# Run BusyBox httpd
CMD ["busybox", "httpd", "-f", "-v", "-p", "80"]
