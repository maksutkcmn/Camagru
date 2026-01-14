package controllers

import (
	"camagru/globals"
	"camagru/services"
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"golang.org/x/crypto/bcrypt"
)

func SetUsername(w http.ResponseWriter, r *http.Request) {

	userID, err := services.GetUserIDFromRequest(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var new struct {
		Username string `json:"username" binding:"required"`
	}
	if err := json.NewDecoder(r.Body).Decode(&new); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := "SELECT id FROM users WHERE username = ?"

	exec, err := globals.DB.PrepareContext(ctx, query)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			http.Error(w, "Timeout", http.StatusInternalServerError)
			return
		}
		http.Error(w, "DB Prepare Error: " + err.Error(), http.StatusInternalServerError)
		return
	}
	defer exec.Close()

	var exists int
	err = exec.QueryRowContext(ctx, new.Username).Scan(&exists)
	if err == nil {
	    http.Error(w, "This username already exists", http.StatusBadRequest)
	    return
	}
	if err != sql.ErrNoRows {
	    http.Error(w, "DB Error", http.StatusInternalServerError)
	    return
	}

	query = "SELECT username, is_verified, notifications FROM users WHERE id = ?"

	getUser, err := globals.DB.PrepareContext(ctx, query)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			http.Error(w, "Timeout", http.StatusInternalServerError)
			return
		}
		http.Error(w, "DB Prepare Error: " + err.Error(), http.StatusInternalServerError)
		return
	}
	defer getUser.Close()

	var user struct {
		Username 		string 	`json:"username"`
		IsVerified 		bool 	`json:"is_verified"`
		Notifications 	bool 	`json:"notifications"`
	}

	err = getUser.QueryRowContext(ctx, userID).Scan(&user.Username, &user.IsVerified, &user.Notifications)
	if err != nil {
		http.Error(w, "User Not Found", http.StatusBadRequest)
		return
	}

	if user.IsVerified == false {
		http.Error(w, "Email not confirmed", http.StatusForbidden)
		return
	}

	query = "UPDATE users SET username = ? WHERE id = ?"
	SetUsername, err := globals.DB.PrepareContext(ctx, query)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			http.Error(w, "Timeout", http.StatusInternalServerError)
			return
		}
		http.Error(w, "DB Prepare Error: " + err.Error(), http.StatusInternalServerError)
		return
	}
	defer SetUsername.Close()

	response, err := SetUsername.ExecContext(ctx, new.Username, userID)
	if err != nil {if errors.Is(err, context.DeadlineExceeded) {
			http.Error(w, "Timeout", http.StatusInternalServerError)
			return
		}
		http.Error(w, "DB Error: " + err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := response.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "No rows were inserted", http.StatusInternalServerError)
		return
	}

	jsonResponse := map[string]interface{}{
		"success": true,
        "message": "Kullanıcı adı başarıyla değiştirildi.",
        "data": map[string]interface{}{
			"user_id":  userID,
            "username": new.Username,
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

func SetEmail(w http.ResponseWriter, r *http.Request) {

	userID, err := services.GetUserIDFromRequest(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var new struct {
		Email string `json:"email" binding:"required"`
	}
	if err := json.NewDecoder(r.Body).Decode(&new); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := "SELECT id FROM users WHERE email = ?"

	exec, err := globals.DB.PrepareContext(ctx, query)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			http.Error(w, "Timeout", http.StatusInternalServerError)
			return
		}
		http.Error(w, "DB Prepare Error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer exec.Close()

	var exists int
	err = exec.QueryRowContext(ctx, new.Email).Scan(&exists)
	if err == nil {
		http.Error(w, "This email already exists", http.StatusBadRequest)
		return
	}
	if err != sql.ErrNoRows {
		http.Error(w, "DB Error", http.StatusInternalServerError)
		return
	}

	query = "SELECT email, is_verified, notifications FROM users WHERE id = ?"

	getUser, err := globals.DB.PrepareContext(ctx, query)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			http.Error(w, "Timeout", http.StatusInternalServerError)
			return
		}
		http.Error(w, "DB Prepare Error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer getUser.Close()

	var user struct {
		Email         string `json:"email"`
		IsVerified    bool   `json:"is_verified"`
		Notifications bool   `json:"notifications"`
	}

	err = getUser.QueryRowContext(ctx, userID).Scan(&user.Email, &user.IsVerified, &user.Notifications)
	if err != nil {
		http.Error(w, "User Not Found", http.StatusBadRequest)
		return
	}

	if user.IsVerified == false {
		http.Error(w, "Email not confirmed", http.StatusForbidden)
		return
	}

	verifyToken, err := services.GenerateVerifyToken()
	if err != nil {
		http.Error(w, "Verify Token Error", http.StatusInternalServerError)
		return
	}

	query = "UPDATE users SET email = ?, is_verified = false, verification_token = ? WHERE id = ?"
	setEmail, err := globals.DB.PrepareContext(ctx, query)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			http.Error(w, "Timeout", http.StatusInternalServerError)
			return
		}
		http.Error(w, "DB Prepare Error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer setEmail.Close()

	response, err := setEmail.ExecContext(ctx, new.Email, verifyToken, userID)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			http.Error(w, "Timeout", http.StatusInternalServerError)
			return
		}
		http.Error(w, "DB Error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := response.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "No rows were updated", http.StatusInternalServerError)
		return
	}

	if err = services.SendVerifyEmail(new.Email, verifyToken); err != nil {
		http.Error(w, "Email not Send", http.StatusInternalServerError)
		return
	}

	jsonResponse := map[string]interface{}{
		"success": true,
		"message": "E-posta başarıyla değiştirildi. Lütfen yeni e-postanızı doğrulayın.",
		"data": map[string]interface{}{
			"user_id": userID,
			"email":   new.Email,
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

func SetPassword(w http.ResponseWriter, r *http.Request) {

	userID, err := services.GetUserIDFromRequest(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var req struct {
		CurrentPassword string `json:"current_password"`
		NewPassword     string `json:"new_password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := "SELECT password_hash, is_verified FROM users WHERE id = ?"

	getUser, err := globals.DB.PrepareContext(ctx, query)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			http.Error(w, "Timeout", http.StatusInternalServerError)
			return
		}
		http.Error(w, "DB Prepare Error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer getUser.Close()

	var user struct {
		PasswordHash string `json:"password_hash"`
		IsVerified   bool   `json:"is_verified"`
	}

	err = getUser.QueryRowContext(ctx, userID).Scan(&user.PasswordHash, &user.IsVerified)
	if err != nil {
		http.Error(w, "User Not Found", http.StatusBadRequest)
		return
	}

	if user.IsVerified == false {
		http.Error(w, "Email not confirmed", http.StatusForbidden)
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.CurrentPassword))
	if err != nil {
		http.Error(w, "Current password is incorrect", http.StatusUnauthorized)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Password hash process failed", http.StatusInternalServerError)
		return
	}

	query = "UPDATE users SET password_hash = ? WHERE id = ?"
	setPassword, err := globals.DB.PrepareContext(ctx, query)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			http.Error(w, "Timeout", http.StatusInternalServerError)
			return
		}
		http.Error(w, "DB Prepare Error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer setPassword.Close()

	response, err := setPassword.ExecContext(ctx, hashedPassword, userID)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			http.Error(w, "Timeout", http.StatusInternalServerError)
			return
		}
		http.Error(w, "DB Error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := response.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "No rows were updated", http.StatusInternalServerError)
		return
	}

	jsonResponse := map[string]interface{}{
		"success": true,
		"message": "Şifre başarıyla değiştirildi.",
		"data": map[string]interface{}{
			"user_id": userID,
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