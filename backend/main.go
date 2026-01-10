package main

import (
	"camagru/globals"
	"camagru/controllers"
	"fmt"
	"net/http"
)

func main() {

	dsn := "root:1234@tcp(localhost:3306)/camagru"
	if err := globals.InitDB(dsn); err != nil {
		fmt.Printf("Error initializing database: %v\n", err)
		return
	}
	defer globals.CloseDB()

	http.HandleFunc("POST /api/register", controllers.Register)
	http.HandleFunc("GET /verify", controllers.VerifyEmail)

	http.ListenAndServe(":8080", nil)
}
