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

func GetFeed(w http.ResponseWriter, r *http.Request) {
	_, err := services.GetUserIDFromRequest(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	// Parse query parameters
	pageStr := r.URL.Query().Get("page")
	limitStr := r.URL.Query().Get("limit")

	page := 1
	limit := 12

	if pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 50 {
			limit = l
		}
	}

	offset := (page - 1) * limit

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// Get total count
	var totalPosts int
	countQuery := "SELECT COUNT(*) FROM posts"
	err = globals.DB.QueryRowContext(ctx, countQuery).Scan(&totalPosts)
	if err != nil {
		http.Error(w, "DB Error", http.StatusInternalServerError)
		return
	}

	// Get posts with user info and counts
	query := `
		SELECT
			p.id,
			p.user_id,
			u.username,
			p.image_path,
			(SELECT COUNT(*) FROM posts_likes WHERE post_id = p.id) as like_count,
			(SELECT COUNT(*) FROM posts_comments WHERE post_id = p.id) as comment_count,
			p.created_at
		FROM posts p
		JOIN users u ON p.user_id = u.id
		ORDER BY p.created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := globals.DB.QueryContext(ctx, query, limit, offset)
	if err != nil {
		http.Error(w, "DB Error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var posts []models.FeedPostDTO

	for rows.Next() {
		var post models.FeedPostDTO
		if err := rows.Scan(
			&post.ID,
			&post.UserID,
			&post.Username,
			&post.ImagePath,
			&post.LikeCount,
			&post.CommentCount,
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

	// Calculate pagination info
	totalPages := (totalPosts + limit - 1) / limit
	if totalPages == 0 {
		totalPages = 1
	}

	pagination := models.PaginationInfo{
		CurrentPage: page,
		TotalPages:  totalPages,
		TotalPosts:  totalPosts,
		Limit:       limit,
		HasNext:     page < totalPages,
		HasPrev:     page > 1,
	}

	jsonResponse := map[string]interface{}{
		"success": true,
		"data": map[string]interface{}{
			"posts":      posts,
			"pagination": pagination,
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