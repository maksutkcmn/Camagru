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

func Register(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var user models.User
	
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	query := "INSERT INTO users (username, email, password_hash, verification_token) VALUES (?, ?, ?, ?)"
	
	exec, err := globals.DB.PrepareContext(ctx, query)
	if err != nil {
		http.Error(w, "DB Prepare Error", http.StatusInternalServerError)
		return
	}
	defer exec.Close()

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Password hash process falied", http.StatusInternalServerError)
		return
	}

	verifyToken, err := services.GenerateVerifyToken()
	if err != nil {
		http.Error(w, "Verify Email Send Error", http.StatusInternalServerError)
		return
	}
	
	if err = services.SendVerifyEmail(user.Email, verifyToken); err != nil {
		http.Error(w, "Email not Send", http.StatusInternalServerError)
		return
	}
	
	response, err := exec.ExecContext(ctx, user.Username, user.Email, hashedPassword, verifyToken)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			http.Error(w, "Timeout", http.StatusInternalServerError)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	rowsAffected, _ := response.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "No rows were inserted", http.StatusInternalServerError)
		return
	}

	userID, err := response.LastInsertId()
	if err != nil {
		http.Error(w, "Error getting userID", http.StatusInternalServerError)
		return
	}
	
	jsonResponse := map[string]interface{}{
		"success": true,
        "message": "Kayıt başarılı! Lütfen hesabınızı doğrulamak için e-posta kutunuzu kontrol edin.",
        "data": map[string]interface{}{
			"user_id":  userID,
            "username": user.Username,
            "email":    user.Email,
        },
	}
	
	responseBytes, err := json.Marshal(jsonResponse)
    if err != nil {
		http.Error(w, "JSON oluşturulamadı", http.StatusInternalServerError)
        return
    }
	
	
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	w.Write(responseBytes)

}