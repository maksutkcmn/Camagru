package controllers

import (
	"camagru/globals"
	"camagru/models"
	"camagru/services"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"golang.org/x/crypto/bcrypt"
)

func Login(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var loginData models.LoginDTO

	if err := json.NewDecoder(r.Body).Decode(&loginData); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := "SELECT id, username, email, password_hash, is_verified FROM users WHERE username = ?"
	
	exec, err := globals.DB.PrepareContext(ctx, query)
	if err != nil {
		http.Error(w, "DB Prepare Error", http.StatusInternalServerError)
		return
	}
	defer exec.Close()

	var is_verified bool
	var user models.User

	err = exec.QueryRowContext(ctx, loginData.Username).Scan(&user.ID, &user.Username, &user.Email, &user.Password, &is_verified)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			http.Error(w, "Timeout", http.StatusInternalServerError)
			return
		}
		http.Error(w, "User not Found", http.StatusBadRequest)
		return
	}

	if is_verified == false {
		http.Error(w, "Email not confirmed", http.StatusBadRequest)
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(loginData.Password))
	if err != nil {
		http.Error(w, "Username or Email dont match", http.StatusUnauthorized)
		return
	}

	token, err := services.GenerateJWT(int(user.ID), user.Username)
	if err != nil {
		http.Error(w, "Cant generate JWT", http.StatusInternalServerError)
		return
	}

	jsonResponse := map[string]interface{}{
		"success": true,
        "message": "Giriş başarılı ana sayfaya yönlendiriliyorsunuz.",
        "data": map[string]interface{}{
			"user_id":  user.ID,
            "username": user.Username,
            "email":    user.Email,
			"token": 	token,
        },
	}

	responseBytes, err := json.Marshal(jsonResponse)
    if err != nil {
		http.Error(w, "JSON cant create", http.StatusInternalServerError)
        return
    }
	
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(responseBytes)
}