package controllers

import (
	"camagru/globals"
	"camagru/services"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"golang.org/x/crypto/bcrypt"
)

func ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req struct {
        Email string `json:"email"`
    }
    
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Bad Input", 400)
        return
    }

	token, err:= services.GenerateVerifyToken()
	if err != nil {
		http.Error(w, "Reset Email Send Error", http.StatusInternalServerError)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	query := "UPDATE users SET reset_token = ?, reset_token_expiry = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE email = ?"

	exec, err := globals.DB.PrepareContext(ctx, query)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			http.Error(w, "Timeout", http.StatusInternalServerError)
			return
		}
		http.Error(w, "DB Prepare Error", http.StatusInternalServerError)
		return
	}
	defer exec.Close()

	response, err := exec.ExecContext(ctx, token ,req.Email)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			http.Error(w, "Timeout", http.StatusInternalServerError)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	rows, _ := response.RowsAffected()
    if rows == 0 {
        http.Error(w, "Email not found", http.StatusBadRequest)
        return
    }

	err = services.SendResetEmail(req.Email, token)

	jsonResponse := map[string]interface{}{
		"success": true,
        "message": "Şifre sıfırlama maili gönderildi.",
        "data": map[string]interface{}{
            "email":    req.Email,
        },
	}
	
	responseBytes, err := json.Marshal(jsonResponse)
    if err != nil {
		http.Error(w, "JSON cant create", http.StatusInternalServerError)
        return
    }
	
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	w.Write(responseBytes)
}

func ResetPassword(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		http.Error(w, "Token required", 400)
		return
	}

	var req struct {
		NewPassword string `json:"new_password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad Input", 400)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var userID int
	query := "SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()"

	err := globals.DB.QueryRowContext(ctx, query, token).Scan(&userID)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			http.Error(w, "Timeout", http.StatusInternalServerError)
			return
		}
		http.Error(w, "Invalid or expired token", http.StatusBadRequest)
		return
	}

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)

	updateQuery := "UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?"
	_, err = globals.DB.ExecContext(ctx, updateQuery, string(hashedPassword), userID)

	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			http.Error(w, "Timeout", http.StatusInternalServerError)
			return
		}
		http.Error(w, "Password change failed", http.StatusInternalServerError)
		return
	}

	jsonResponse := map[string]interface{}{
		"success": true,
		"message": "Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz.",
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