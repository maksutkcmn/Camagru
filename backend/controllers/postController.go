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
	defer exec.Close()

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

func DeletePost(w http.ResponseWriter, r *http.Request) {
	userID, err := services.GetUserIDFromRequest(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	postIDstr := r.PathValue("post_id")
	postID, err := strconv.Atoi(postIDstr)
	if err != nil {
		http.Error(w, "Invalid post ID", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	checkQuery := "SELECT user_id FROM posts WHERE id = ?"
	var postOwnerID int
	err = globals.DB.QueryRowContext(ctx, checkQuery, postID).Scan(&postOwnerID)
	if err != nil {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	if postOwnerID != userID {
		http.Error(w, "Unauthorized", http.StatusForbidden)
		return
	}

	deleteQuery := "DELETE FROM posts WHERE id = ? AND user_id = ?"
	exec, err := globals.DB.PrepareContext(ctx, deleteQuery)
	if err != nil {
		http.Error(w, "DB Prepare Error", http.StatusInternalServerError)
		return
	}
	defer exec.Close()

	result, err := exec.ExecContext(ctx, postID, userID)
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
		http.Error(w, "Post could not be deleted", http.StatusInternalServerError)
		return
	}

	jsonResponse := map[string]interface{}{
		"success": true,
		"message": "Gönderi silindi",
		"data": map[string]interface{}{
			"post_id": postID,
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

	checkQuery := "SELECT id, user_id FROM posts WHERE id = ?"
	var postID int
	var toUserID int
	err = globals.DB.QueryRowContext(ctx, checkQuery, comment.PostID).Scan(&postID, &toUserID)
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

	if userID != toUserID {
		emailQuery := "SELECT username, email, notifications, is_verified FROM users WHERE id = ?"
		var isVerified bool
		var isNotifications bool
		var toUsername string
		var toEmail string
		err = globals.DB.QueryRowContext(ctx, emailQuery, toUserID).Scan(&toUsername, &toEmail, &isNotifications, &isVerified)

		if isVerified && isNotifications {
			var fromUsername string
			err = globals.DB.QueryRowContext(ctx, "SELECT username FROM users WHERE id = ?", userID).Scan(&fromUsername)

			notifications := models.NotificationEmail{
				ToUsername:   toUsername,
				FromUserID:   int64(userID),
				FromUsername: fromUsername,
				EmailType:    models.EmailTypePostCommented,
				PostID:       int64(comment.PostID),
			}

			if err = services.SendNotificationEmail(toEmail, notifications); err != nil {
				http.Error(w, "Email not send", http.StatusInternalServerError)
				return
			}
		}
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

	postIDstr := r.PathValue("post_id")
	postID, err := strconv.Atoi(postIDstr)
	if err != nil {
		http.Error(w, "Post not found", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	checkPostQuery := "SELECT id, user_id FROM posts WHERE id = ?"
	var existingPostID int
	var toUserID int
	err = globals.DB.QueryRowContext(ctx, checkPostQuery, postID).Scan(&existingPostID, &toUserID)
	if err != nil {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	checkLikeQuery := "SELECT id FROM posts_likes WHERE user_id = ? AND post_id = ?"
	var likeID int
	err = globals.DB.QueryRowContext(ctx, checkLikeQuery, userID, postID).Scan(&likeID)

	var query string
	var message models.EmailType
	var action string

	if err != nil {
		query = "INSERT INTO posts_likes (user_id, post_id) VALUES (?, ?)"
		message = models.EmailTypePostLiked
		action = "liked"
	} else {
		query = "DELETE FROM posts_likes WHERE user_id = ? AND post_id = ?"
		message = models.EmailTypePostUnLiked
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

	if userID != toUserID {
		emailQuery := "SELECT username, email, notifications, is_verified FROM users WHERE id = ?"
		var isVerified bool
		var isNotifications bool
		var toUsername string
		var toEmail string
		err = globals.DB.QueryRowContext(ctx, emailQuery, toUserID).Scan(&toUsername, &toEmail, &isNotifications, &isVerified)

		if err == nil && isVerified && isNotifications {
			var fromUsername string
			globals.DB.QueryRowContext(ctx, "SELECT username FROM users WHERE id = ?", userID).Scan(&fromUsername)

			notifications := models.NotificationEmail{
				ToUsername:   toUsername,
				FromUserID:   int64(userID),
				FromUsername: fromUsername,
				EmailType:    message,
			}

			services.SendNotificationEmail(toEmail, notifications)
		}
	}
		
	var newLikeCount int
	countQuery := "SELECT COUNT(*) FROM posts_likes WHERE post_id = ?"
	globals.DB.QueryRowContext(ctx, countQuery, postID).Scan(&newLikeCount)

	jsonResponse := map[string]interface{}{
		"success": true,
		"message": "Beğeni bildirimi gönderildi",
		"data": map[string]interface{}{
			"post_id":    postID,
			"user_id":    userID,
			"action":     action,
			"like_count": newLikeCount,
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

func DeleteComment(w http.ResponseWriter, r *http.Request) {
	userID, err := services.GetUserIDFromRequest(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	commentIDstr := r.PathValue("comment_id")
	commentID, err := strconv.Atoi(commentIDstr)
	if err != nil {
		http.Error(w, "Invalid comment ID", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	checkQuery := "SELECT user_id FROM posts_comments WHERE id = ?"
	var commentOwnerID int
	err = globals.DB.QueryRowContext(ctx, checkQuery, commentID).Scan(&commentOwnerID)
	if err != nil {
		http.Error(w, "Comment not found", http.StatusNotFound)
		return
	}

	if commentOwnerID != userID {
		http.Error(w, "Unauthorized", http.StatusForbidden)
		return
	}

	deleteQuery := "DELETE FROM posts_comments WHERE id = ? AND user_id = ?"
	exec, err := globals.DB.PrepareContext(ctx, deleteQuery)
	if err != nil {
		http.Error(w, "DB Prepare Error", http.StatusInternalServerError)
		return
	}
	defer exec.Close()

	result, err := exec.ExecContext(ctx, commentID, userID)
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
		http.Error(w, "Comment could not be deleted", http.StatusInternalServerError)
		return
	}

	jsonResponse := map[string]interface{}{
		"success": true,
		"message": "Yorum silindi",
		"data": map[string]interface{}{
			"comment_id": commentID,
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
