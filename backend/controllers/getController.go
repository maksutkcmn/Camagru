package controllers

import (
	"camagru/globals"
	"camagru/models"
	"camagru/services"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"
)

func GetMe(w http.ResponseWriter, r *http.Request) {
	userID, err := services.GetUserIDFromRequest(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	query := "SELECT username, email, notifications, is_verified, created_at FROM users WHERE id = ?"
	var user models.UserDTO

	err = globals.DB.QueryRowContext(ctx, query, userID).Scan(&user.Username, &user.Email, &user.Notifications, &user.IsVerified, &user.CreatedAt)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			http.Error(w, "Timeout", http.StatusInternalServerError)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	jsonResponse := map[string]interface{}{
		"success": true,
		"data": map[string]interface{}{
			"user_id": userID,
			"username": user.Username,
			"email": user.Email,
			"notifications": user.Notifications,
			"is_verified": user.IsVerified,
			"created_at": user.CreatedAt,
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

func GetUserByID(w http.ResponseWriter, r *http.Request)  {
	_, err := services.GetUserIDFromRequest(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	username := r.PathValue("username")

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	query := "SELECT id, username, email, notifications, is_verified, created_at FROM users WHERE username = ?"

	var userID 	int
	var user 	models.UserDTO
	err = globals.DB.QueryRowContext(ctx, query, username).Scan(&userID, &user.Username, &user.Email, &user.Notifications, &user.IsVerified, &user.CreatedAt)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			http.Error(w, "Timeout", http.StatusInternalServerError)
			return
		}
		http.Error(w, "User not Found", http.StatusBadRequest)
		return
	}

	jsonResponse := map[string]interface{}{
		"success": true,
		"data": map[string]interface{}{
			"user_id": userID,
			"username": user.Username,
			"email": user.Email,
			"notifications": user.Notifications,
			"is_verified": user.IsVerified,
			"created_at": user.CreatedAt,
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

func GetUserPosts(w http.ResponseWriter, r *http.Request)  {
	userID, err := services.GetUserIDFromRequest(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	query := "SELECT id, user_id, image_path, created_at FROM posts WHERE user_id = ?"
	rows, err := globals.DB.QueryContext(ctx, query, userID)
	if err != nil {
		http.Error(w, "DB Error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var posts []models.PostDTO

	for rows.Next() {
		var post models.PostDTO
		if err := rows.Scan(
			&post.ID,
			&post.UserID,
			&post.ImagePath,
			&post.CreatedAt,
		); err != nil {
			http.Error(w, "DB Error", http.StatusInternalServerError)
			return
		}
		posts = append(posts, post)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "DB Error", http.StatusInternalServerError)
		return
	}

	jsonResponse := map[string]interface{}{
		"success": true,
		"data": map[string]interface{}{
			"posts": posts,
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

func GetPostComments(w http.ResponseWriter, r *http.Request)  {
	_, err := services.GetUserIDFromRequest(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	postIDstr := r.PathValue("post_id")
	postID, err := strconv.Atoi(postIDstr)
	if err != nil {
		http.Error(w, "Post not found", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	query := "SELECT id, user_id, comment, created_at FROM posts_comments WHERE post_id = ?"
	rows, err := globals.DB.QueryContext(ctx, query, postID)
	if err != nil {
		http.Error(w, "DB Error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var comments []models.PostCommentsDTO

	for rows.Next() {
		var comment models.PostCommentsDTO
		if err := rows.Scan(
			&comment.ID,
			&comment.UserID,
			&comment.Comment,
			&comment.CreatedAt,
		); err != nil {
			http.Error(w, "DB Error", http.StatusInternalServerError)
			return
		}
		comments = append(comments, comment)
	}

	jsonResponse := map[string]interface{}{
		"success": true,
		"data": map[string]interface{}{
			"comments": comments,
			"count": len(comments),
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