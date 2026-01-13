package controllers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"camagru/globals"
	"camagru/models"
	"camagru/services"
)

func CreatePost(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	userID, err := services.GetUserIDFromRequest(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	var post models.CreatePostRequest
	if err := json.NewDecoder(r.Body).Decode(&post); err != nil {
		http.Error(w, "Bad input", http.StatusBadRequest)
		return
	}

	savedPath, err := services.CreateImage(post.ImageData, post.FilterName)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return 
	}

	query := "INSERT INTO posts (user_id, image_path) VALUES (?, ?)"

	exec, err := globals.DB.PrepareContext(ctx, query)
	if err != nil {
		http.Error(w, "DB Prepare Error", http.StatusInternalServerError)
		return
	}

	response, err := exec.ExecContext(ctx, userID, savedPath)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			http.Error(w, "Timeout", http.StatusInternalServerError)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := response.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "No rows were inserted", http.StatusInternalServerError)
		return
	}

	postID, err := response.LastInsertId()
	if err != nil {
		http.Error(w, "Error getting postID", http.StatusInternalServerError)
		return
	}

	jsonResponse := map[string]interface{}{
		"success": true,
        "message": "Gönderi oluşturuldu",
        "data": map[string]interface{}{
			"user_id":  userID,
			"post_id":  postID,
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

func CommentPost(w http.ResponseWriter, r *http.Request)  {
	userID, err := services.GetUserIDFromRequest(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var comment models.CreateComment
	if err := json.NewDecoder(r.Body).Decode(&comment); err != nil {
		http.Error(w, "Bad Input", http.StatusBadRequest)
		return
	}

	if len(comment.Comment) >= 255 {
		http.Error(w, "Too long comment", http.StatusBadRequest)
		return
	}

	checkQuery := "SELECT id FROM posts WHERE id = ?"
	var postID int
	err = globals.DB.QueryRowContext(ctx, checkQuery, comment.PostID).Scan(&postID)
	if err != nil {
		http.Error(w, "Post bulunamadı", http.StatusNotFound)
		return
	}

	insertQuery := "INSERT INTO posts_comments (user_id, post_id, comment) VALUES (?, ?, ?)"
	exec, err := globals.DB.PrepareContext(ctx, insertQuery)
	if err != nil {
		http.Error(w, "DB Prepare Error", http.StatusInternalServerError)
		return
	}
	defer exec.Close()

	result, err := exec.ExecContext(ctx, userID, comment.PostID, comment.Comment)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			http.Error(w, "Timeout", http.StatusInternalServerError)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "Comment cant added", http.StatusInternalServerError)
		return
	}

	commentID, err := result.LastInsertId()
	if err != nil {
		http.Error(w, "Error getting commentID", http.StatusInternalServerError)
		return
	}

	jsonResponse := map[string]interface{}{
		"success": true,
		"message": "Yorum eklendi",
		"data": map[string]interface{}{
			"comment_id": commentID,
			"post_id":    comment.PostID,
			"user_id":    userID,
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

func LikePost(w http.ResponseWriter, r *http.Request)  {
	userID, err := services.GetUserIDFromRequest(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	postIDstr := r.PathValue("postid")
	postID, err := strconv.Atoi(postIDstr)
	if err != nil {
		http.Error(w, "Post not found", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	checkPostQuery := "SELECT id FROM posts WHERE id = ?"
	var existingPostID int
	err = globals.DB.QueryRowContext(ctx, checkPostQuery, postID).Scan(&existingPostID)
	if err != nil {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	checkLikeQuery := "SELECT id FROM posts_likes WHERE user_id = ? AND post_id = ?"
	var likeID int
	err = globals.DB.QueryRowContext(ctx, checkLikeQuery, userID, postID).Scan(&likeID)

	var query string
	var message string
	var action string

	if err != nil {
		query = "INSERT INTO posts_likes (user_id, post_id) VALUES (?, ?)"
		message = "Like eklendi"
		action = "liked"
	} else {
		query = "DELETE FROM posts_likes WHERE user_id = ? AND post_id = ?"
		message = "Like kaldırıldı"
		action = "unliked"
	}

	exec, err := globals.DB.PrepareContext(ctx, query)
	if err != nil {
		http.Error(w, "DB Prepare Error" + err.Error(), http.StatusInternalServerError)
		return
	}
	defer exec.Close()

	result, err := exec.ExecContext(ctx, userID, postID)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			http.Error(w, "Timeout", http.StatusInternalServerError)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "Database Error", http.StatusInternalServerError)
		return
	}

	jsonResponse := map[string]interface{}{
		"success": true,
		"message": message,
		"data": map[string]interface{}{
			"post_id": postID,
			"user_id": userID,
			"action":  action,
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
