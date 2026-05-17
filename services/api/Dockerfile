FROM golang:1.26-alpine AS builder

WORKDIR /app

# go.work + services/api の依存を先にキャッシュ
COPY go.work go.work.sum ./
COPY services/api/go.mod services/api/go.sum ./services/api/
RUN go work sync && go mod download -modfile=services/api/go.mod

COPY services/api/ ./services/api/

RUN CGO_ENABLED=0 GOOS=linux go build -o server ./services/api/cmd/server

FROM alpine:3.21

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

COPY --from=builder /app/server .

EXPOSE 8080

CMD ["./server"]
