package main

import (
	"camagru/controllers"
	"camagru/globals"
	"camagru/services"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/joho/godotenv"
)

func requireEnv(key string) string {
	val := os.Getenv(key)
	if val == "" {
		log.Fatalf("required environment variable %q is not set", key)
	}
	return val
}

func securityHeadersMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		next.ServeHTTP(w, r)
	})
}

func corsMiddleware(allowedOrigin string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found")
	}

	dsn := requireEnv("DB_DSN")
	frontendURL := requireEnv("FRONTEND_URL")
	requireEnv("JWT_SECRET")
	requireEnv("SMTP_FROM")
	requireEnv("SMTP_PASSWORD")
	requireEnv("SMTP_HOST")
	requireEnv("SMTP_PORT")
	requireEnv("APP_URL")

	services.InitJWT()
	services.ValidateEmailConfig()

	if err := globals.InitDB(dsn); err != nil {
		log.Fatalf("failed to initialize database: %v", err)
	}
	defer globals.CloseDB()

	mux := http.NewServeMux()

	mux.HandleFunc("POST /api/register", controllers.Register)
	mux.HandleFunc("POST /api/login", controllers.Login)

	mux.HandleFunc("POST /api/create/post", controllers.CreatePost)
	mux.HandleFunc("DELETE /api/delete/post/{post_id}", controllers.DeletePost)
	mux.HandleFunc("POST /api/comment/post", controllers.CommentPost)
	mux.HandleFunc("DELETE /api/delete/comment/{comment_id}", controllers.DeleteComment)
	mux.HandleFunc("POST /api/like/post/{post_id}", controllers.LikePost)

	mux.HandleFunc("PATCH /api/set/username", controllers.SetUsername)
	mux.HandleFunc("PATCH /api/set/email", controllers.SetEmail)
	mux.HandleFunc("PATCH /api/set/password", controllers.SetPassword)
	mux.HandleFunc("PATCH /api/set/notifications", controllers.SetNotifications)
	mux.HandleFunc("POST /api/forgot-password", controllers.ForgotPassword)
	mux.HandleFunc("POST /api/reset-password", controllers.ResetPassword)

	mux.HandleFunc("GET /api/get/me", controllers.GetMe)
	mux.HandleFunc("GET /api/get/user/{username}", controllers.GetUserByID)
	mux.HandleFunc("GET /api/get/posts", controllers.GetUserPosts)
	mux.HandleFunc("GET /api/get/user/{username}/posts", controllers.GetUserPostsByUsername)
	mux.HandleFunc("GET /api/get/post/comments/{post_id}", controllers.GetPostComments)
	mux.HandleFunc("GET /api/get/feed", controllers.GetFeed)

	mux.HandleFunc("GET /verify", controllers.VerifyEmail)

	mux.HandleFunc("/uploads/", func(w http.ResponseWriter, r *http.Request) {
		name := filepath.Base(strings.TrimPrefix(r.URL.Path, "/uploads/"))
		filePath := filepath.Join("uploads", name)
		if _, err := os.Stat(filePath); os.IsNotExist(err) {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "image/png")
		w.Header().Set("Content-Disposition", "inline")
		http.ServeFile(w, r, filePath)
	})
	mux.Handle("/filters/", http.StripPrefix("/filters/", http.FileServer(http.Dir("filters"))))

	handler := securityHeadersMiddleware(corsMiddleware(frontendURL, mux))

	log.Println("Server starting on :8080")
	http.ListenAndServe(":8080", handler)
}
