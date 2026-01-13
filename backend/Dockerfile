# Build stage
FROM golang:1.25.4-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git

# Set working directory
WORKDIR /build

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Runtime stage
FROM alpine:latest

# Install ca-certificates for HTTPS
RUN apk --no-cache add ca-certificates

# Create app directory
WORKDIR /app

# Create directories for uploads and filters
RUN mkdir -p /app/uploads /app/filters

# Copy binary from builder
COPY --from=builder /build/main .

# Copy .env file (optional - prefer environment variables in docker-compose)
# COPY .env .

# Expose port
EXPOSE 8080

# Run the application
CMD ["./main"]
