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
	// Load environment variables
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
	http.HandleFunc("GET /verify", controllers.VerifyEmail)

	http.ListenAndServe(":8080", nil)
}
