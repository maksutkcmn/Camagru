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
	Comment		string	`json:"comment"`
	CreatedAt 	string 	`json:"created_at"`
}