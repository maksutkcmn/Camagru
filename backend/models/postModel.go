package models

type CreatePostRequest struct {
    ImageData  string `json:"image"`
    FilterName string `json:"filter"`
}

type CreateComment struct {
	PostID 	int		`json:"postid" binding:"required"`
	Comment string	`json:"comment" binding:"required"`
}

type PostDTO struct {
	ID			int		`json:"id"`
	UserID		int		`json:"user_id"`
	ImagePath 	string 	`json:"image_path"`
	CreatedAt 	string 	`json:"created_at"`
}

type PostCommentsDTO struct {
	ID			int		`json:"id"`
	UserID		int		`json:"user_id"`
	Username	string	`json:"username"`
	Comment		string	`json:"comment"`
	CreatedAt 	string 	`json:"created_at"`
}

type FeedPostDTO struct {
	ID           int    `json:"id"`
	UserID       int    `json:"user_id"`
	Username     string `json:"username"`
	ImagePath    string `json:"image_path"`
	LikeCount    int    `json:"like_count"`
	CommentCount int    `json:"comment_count"`
	IsLiked      bool   `json:"is_liked"`
	CreatedAt    string `json:"created_at"`
}

type PaginationInfo struct {
	CurrentPage int  `json:"current_page"`
	TotalPages  int  `json:"total_pages"`
	TotalPosts  int  `json:"total_posts"`
	Limit       int  `json:"limit"`
	HasNext     bool `json:"has_next"`
	HasPrev     bool `json:"has_prev"`
}