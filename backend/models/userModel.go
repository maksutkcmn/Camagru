package models

type User struct {
	ID       		int64  `json:"id"`
	Username 		string `json:"username" binding:"required"`
	Email    		string `json:"email" binding:"required"`
	Password    	string `json:"password" binding:"required"`
}

type LoginDTO struct {
	Username	string	`json:"username" binding:"required"`
	Password	string	`json:"password" binding:"required"`
}