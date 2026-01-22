FROM golang:1.25.4-alpine AS builder

RUN apk add --no-cache git

WORKDIR /build

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /app

RUN mkdir -p /app/uploads /app/filters

COPY --from=builder /build/main .

EXPOSE 8080

CMD ["./main"]