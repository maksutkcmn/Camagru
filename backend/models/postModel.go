package models

type CreatePostRequest struct {
    ImageData  string `json:"image"`
    FilterName string `json:"filter"`
}

type CreateComment struct {
	PostID 	int		`json:"postid" binding:"required"`
	Comment string	`json:"comment" binding:"required"`
}