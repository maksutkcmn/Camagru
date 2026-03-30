package controllers

import (
	"camagru/globals"
	"context"
	"errors"
	"log"
	"net/http"
	"time"
)

func VerifyEmail(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	token := r.URL.Query().Get("token")
	if token == ""{
		http.Error(w, "Token not found", http.StatusBadRequest)
		return
	}

	query := "UPDATE users SET is_verified = 1, verification_token = NULL WHERE verification_token = ?"

	stmt, err := globals.DB.PrepareContext(ctx, query)
	if err != nil {
		http.Error(w, "DB Prepare Error", http.StatusInternalServerError)
		return
	}
	defer stmt.Close()

	result, err := stmt.ExecContext(ctx, token)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			http.Error(w, "Timeout", http.StatusInternalServerError)
			return
		}
		log.Printf("VerifyEmail: db error: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "Invalid Token", http.StatusForbidden)
		return
	}

	w.Write([]byte("Hesabınız başarıyla doğrulandı! Giriş yapabilirsiniz."))
}
