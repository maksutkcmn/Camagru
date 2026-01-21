package main

import (
	"camagru/globals"
	"camagru/controllers"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found")
	}

	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		log.Fatal("DB_DSN environment variable is not set")
	}

	if err := globals.InitDB(dsn); err != nil {
		fmt.Printf("Error initializing database: %v\n", err)
		return
	}
	defer globals.CloseDB()

	http.HandleFunc("POST /api/register", controllers.Register)
	http.HandleFunc("POST /api/login", controllers.Login)

	http.HandleFunc("POST /api/create/post", controllers.CreatePost)
	http.HandleFunc("GET /api/delete/post/{post_id}", controllers.DeletePost)
	http.HandleFunc("POST /api/comment/post", controllers.CommentPost)
	http.HandleFunc("GET /api/like/post/{post_id}", controllers.LikePost)
	
	http.HandleFunc("PATCH /api/set/username", controllers.SetUsername)
	http.HandleFunc("PATCH /api/set/email", controllers.SetEmail)
	http.HandleFunc("PATCH /api/set/password", controllers.SetPassword)
	http.HandleFunc("PATCH /api/set/notifications", controllers.SetNotifications)
	http.HandleFunc("POST /api/forgot-password", controllers.ForgotPassword)
	http.HandleFunc("POST /api/reset-password", controllers.ResetPassword)
	
	http.HandleFunc("GET /api/get/me", controllers.GetMe)
	http.HandleFunc("GET /api/get/user/{username}", controllers.GetUserByID)
	http.HandleFunc("GET /api/get/posts", controllers.GetUserPosts)
	http.HandleFunc("GET /api/get/post/comments/{post_id}", controllers.GetPostComments)

	http.HandleFunc("GET /verify", controllers.VerifyEmail)

	http.ListenAndServe(":8080", nil)
}
