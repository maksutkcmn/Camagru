package controllers

import (
	"camagru/globals"
	"camagru/services"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"time"
)

func SetNotifications(w http.ResponseWriter, r *http.Request) {
	userID, err := services.GetUserIDFromRequest(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	checkLikeQuery := "SELECT is_verified, notifications FROM users WHERE id = ?"
	var isVerified bool
	var notifications bool
	err = globals.DB.QueryRowContext(ctx, checkLikeQuery, userID).Scan(&isVerified, &notifications)

	var query string
	var message string
	var action bool

	query = "UPDATE users SET notifications = ? WHERE id = ?"
	if notifications == false{
		message = "Bildirimler açıldı"
		action = true
	} else {
		message = "Bildirimler kapatıldı"
		action = false
	}

	exec, err := globals.DB.PrepareContext(ctx, query)
	if err != nil {
		http.Error(w, "DB Prepare Error" + err.Error(), http.StatusInternalServerError)
		return
	}
	defer exec.Close()

	response, err := exec.ExecContext(ctx, action, userID)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			http.Error(w, "Timeout", http.StatusInternalServerError)
			return
		}
		http.Error(w, "DB Prepare Error", http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := response.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "Database Error", http.StatusInternalServerError)
		return
	}

	jsonResponse := map[string]interface{}{
		"success": true,
		"message": message,
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